import {
  formValuesToInsert,
  formValuesToUpdate,
  mapDbProductToProduct,
} from "@/lib/products/mapper";
import {
  formatBarcode,
  formatSku,
  normalizeBarcode,
  normalizeSku,
  slugifyProductName,
} from "@/lib/products/identifiers";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IProductRepository } from "@/repositories/product.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { Product, ProductFormValues } from "@/types/product";
import type { SupabaseServerClient } from "@/lib/supabase/server";

export interface IProductService {
  list(ctx: ServiceContext, session: AuthSession): Promise<Product[]>;
  getById(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Product | null>;
  create(
    ctx: ServiceContext,
    session: AuthSession,
    values: ProductFormValues
  ): Promise<Product>;
  update(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    values: ProductFormValues
  ): Promise<Product>;
  archive(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Product>;
  restore(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Product>;
  delete(ctx: ServiceContext, session: AuthSession, id: string): Promise<void>;
  search(
    ctx: ServiceContext,
    session: AuthSession,
    query: string
  ): Promise<Product[]>;
}

export class ProductService implements IProductService {
  constructor(
    private readonly products: IProductRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly client: SupabaseServerClient
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "products", action)) {
      throw new ServiceError(
        `Forbidden: missing permission products.${action}`,
        "FORBIDDEN",
        403
      );
    }
  }

  private async resolveRow(id: string) {
    const row = await this.products.getById(id);
    if (!row) {
      throw new ServiceError("Product not found.", "NOT_FOUND", 404);
    }
    return row;
  }

  private async log(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      action: string;
      actionCode: string;
      entityId: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: "products",
      entityType: "product",
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  private async assertUniqueName(name: string, excludeId?: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ServiceError("Product name is required.", "VALIDATION", 400);
    }
    if (await this.products.existsByName(trimmed, excludeId)) {
      throw new ServiceError(
        "A product with this name already exists.",
        "VALIDATION",
        400
      );
    }
  }

  private async resolveSlug(name: string): Promise<string> {
    let slug = slugifyProductName(name);
    if (!slug) {
      throw new ServiceError("Invalid product name.", "VALIDATION", 400);
    }
    const existing = await this.products.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    return slug;
  }

  private async resolveBarcode(
    value: string,
    excludeId?: string
  ): Promise<string> {
    const trimmed = value.trim();
    if (trimmed) {
      const barcode = normalizeBarcode(trimmed);
      if (await this.products.existsByBarcode(barcode, excludeId)) {
        throw new ServiceError("Barcode already exists.", "VALIDATION", 400);
      }
      return barcode;
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const seq = await this.products.getNextIdentifierSequence();
      const barcode = formatBarcode(seq);
      if (!(await this.products.existsByBarcode(barcode, excludeId))) {
        return barcode;
      }
    }

    throw new ServiceError(
      "Unable to generate a unique barcode.",
      "VALIDATION",
      400
    );
  }

  private async resolveSku(value: string, excludeId?: string): Promise<string> {
    const trimmed = value.trim();
    if (trimmed) {
      const sku = normalizeSku(trimmed);
      if (await this.products.existsBySku(sku, excludeId)) {
        throw new ServiceError("SKU already exists.", "VALIDATION", 400);
      }
      return sku;
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const seq = await this.products.getNextIdentifierSequence();
      const sku = formatSku(seq);
      if (!(await this.products.existsBySku(sku, excludeId))) {
        return sku;
      }
    }

    throw new ServiceError("Unable to generate a unique SKU.", "VALIDATION", 400);
  }

  private validateForm(values: ProductFormValues): void {
    if (!values.categoryId) {
      throw new ServiceError("Category is required.", "VALIDATION", 400);
    }
    if (!values.name.trim()) {
      throw new ServiceError("Product name is required.", "VALIDATION", 400);
    }
    if (values.sellingPrice < 0) {
      throw new ServiceError(
        "Selling price cannot be negative.",
        "VALIDATION",
        400
      );
    }
    if (values.minimumStock < 0) {
      throw new ServiceError(
        "Minimum stock cannot be negative.",
        "VALIDATION",
        400
      );
    }
  }

  async list(ctx: ServiceContext, session: AuthSession): Promise<Product[]> {
    this.require(session, "view");
    const rows = await this.products.list(true);
    return rows.map(mapDbProductToProduct);
  }

  async getById(
    _ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Product | null> {
    this.require(session, "view");
    const row = await this.products.getById(id);
    return row ? mapDbProductToProduct(row) : null;
  }

  async create(
    ctx: ServiceContext,
    session: AuthSession,
    values: ProductFormValues
  ): Promise<Product> {
    this.require(session, "create");
    this.validateForm(values);
    await this.assertUniqueName(values.name);

    const slug = await this.resolveSlug(values.name);
    const barcode = await this.resolveBarcode(values.barcode);
    const sku = await this.resolveSku(values.sku);

    const row = await this.products.create(
      formValuesToInsert(values, slug, barcode, sku)
    );

    await this.log(ctx, session, {
      action: `Created product ${row.name}`,
      actionCode: ActivityActionCodes.PRODUCT_CREATED,
      entityId: row.id,
      metadata: { sku: row.sku, barcode: row.barcode, name: row.name },
    });

    return mapDbProductToProduct(row);
  }

  async update(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    values: ProductFormValues
  ): Promise<Product> {
    this.require(session, "edit");
    const row = await this.resolveRow(id);
    this.validateForm(values);
    await this.assertUniqueName(values.name, row.id);

    const barcode = await this.resolveBarcode(values.barcode, row.id);
    const sku = await this.resolveSku(values.sku, row.id);

    const updated = await this.products.update(row.id, {
      ...formValuesToUpdate(values),
      barcode,
      sku,
    });

    await this.log(ctx, session, {
      action: `Updated product ${updated.name}`,
      actionCode: ActivityActionCodes.PRODUCT_UPDATED,
      entityId: updated.id,
      metadata: { sku: updated.sku, barcode: updated.barcode },
    });

    return mapDbProductToProduct(updated);
  }

  async archive(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Product> {
    this.require(session, "edit");
    const row = await this.resolveRow(id);
    if (!row.is_active) {
      throw new ServiceError("Product is already archived.", "VALIDATION", 400);
    }

    const archived = await this.products.archive(row.id);

    await this.log(ctx, session, {
      action: `Archived product ${archived.name}`,
      actionCode: ActivityActionCodes.PRODUCT_ARCHIVED,
      entityId: archived.id,
      metadata: { sku: archived.sku },
    });

    return mapDbProductToProduct(archived);
  }

  async restore(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Product> {
    this.require(session, "edit");
    const row = await this.resolveRow(id);
    if (row.is_active) {
      throw new ServiceError("Product is already active.", "VALIDATION", 400);
    }

    const restored = await this.products.restore(row.id);

    await this.log(ctx, session, {
      action: `Restored product ${restored.name}`,
      actionCode: ActivityActionCodes.PRODUCT_RESTORED,
      entityId: restored.id,
      metadata: { sku: restored.sku },
    });

    return mapDbProductToProduct(restored);
  }

  async delete(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<void> {
    this.require(session, "delete");
    const row = await this.resolveRow(id);
    await this.products.delete(row.id);

    await this.log(ctx, session, {
      action: `Deleted product ${row.name}`,
      actionCode: ActivityActionCodes.PRODUCT_DELETED,
      entityId: row.id,
      metadata: { deleted: true, sku: row.sku },
    });
  }

  async search(
    _ctx: ServiceContext,
    session: AuthSession,
    query: string
  ): Promise<Product[]> {
    this.require(session, "view");
    const rows = await this.products.search(query);
    return rows.map(mapDbProductToProduct);
  }

  getClient(): SupabaseServerClient {
    return this.client;
  }
}
