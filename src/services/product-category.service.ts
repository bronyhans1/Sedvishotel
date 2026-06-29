import {
  formValuesToInsert,
  formValuesToUpdate,
  mapDbProductCategoryToProductCategory,
} from "@/lib/product-categories/mapper";
import { slugifyProductCategoryName } from "@/lib/product-categories/slug";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IProductCategoryRepository } from "@/repositories/product-category.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type {
  ProductCategory,
  ProductCategoryFormValues,
} from "@/types/product-category";

export interface IProductCategoryService {
  list(ctx: ServiceContext, session: AuthSession): Promise<ProductCategory[]>;
  getById(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<ProductCategory | null>;
  create(
    ctx: ServiceContext,
    session: AuthSession,
    values: ProductCategoryFormValues
  ): Promise<ProductCategory>;
  update(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    values: ProductCategoryFormValues
  ): Promise<ProductCategory>;
  archive(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<ProductCategory>;
  restore(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<ProductCategory>;
  delete(ctx: ServiceContext, session: AuthSession, id: string): Promise<void>;
  getDeleteBlockers(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<string[]>;
  reorder(
    ctx: ServiceContext,
    session: AuthSession,
    items: { id: string; displayOrder: number }[]
  ): Promise<void>;
}

export class ProductCategoryService implements IProductCategoryService {
  constructor(
    private readonly categories: IProductCategoryRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "product_categories", action)) {
      throw new ServiceError(
        `Forbidden: missing permission product_categories.${action}`,
        "FORBIDDEN",
        403
      );
    }
  }

  private async resolveRow(id: string) {
    const row = await this.categories.getById(id);
    if (!row) {
      throw new ServiceError("Product category not found.", "NOT_FOUND", 404);
    }
    return row;
  }

  private async toCategory(
    row: Awaited<ReturnType<IProductCategoryRepository["getById"]>>
  ) {
    if (!row) return null;
    const productCount = await this.categories.getProductCount(row.id);
    return mapDbProductCategoryToProductCategory(row, productCount);
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
      module: "product_categories",
      entityType: "product_category",
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  private async assertUniqueName(name: string, excludeId?: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ServiceError("Category name is required.", "VALIDATION", 400);
    }
    const exists = await this.categories.existsByName(trimmed, excludeId);
    if (exists) {
      throw new ServiceError(
        "A category with this name already exists.",
        "VALIDATION",
        400
      );
    }
  }

  private async resolveSlug(name: string): Promise<string> {
    let slug = slugifyProductCategoryName(name);
    if (!slug) {
      throw new ServiceError("Invalid category name.", "VALIDATION", 400);
    }
    const existing = await this.categories.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    return slug;
  }

  async list(ctx: ServiceContext, session: AuthSession): Promise<ProductCategory[]> {
    this.require(session, "view");
    const rows = await this.categories.list(true);
    return Promise.all(
      rows.map(async (row) => {
        const productCount = await this.categories.getProductCount(row.id);
        return mapDbProductCategoryToProductCategory(row, productCount);
      })
    );
  }

  async getById(
    _ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<ProductCategory | null> {
    this.require(session, "view");
    const row = await this.categories.getById(id);
    return this.toCategory(row);
  }

  async create(
    ctx: ServiceContext,
    session: AuthSession,
    values: ProductCategoryFormValues
  ): Promise<ProductCategory> {
    this.require(session, "create");
    await this.assertUniqueName(values.name);

    const slug = await this.resolveSlug(values.name);
    const displayOrder =
      values.displayOrder > 0
        ? values.displayOrder
        : await this.categories.getNextDisplayOrder();

    const row = await this.categories.create(
      formValuesToInsert(values, slug, displayOrder)
    );

    await this.log(ctx, session, {
      action: `Created product category ${row.name}`,
      actionCode: ActivityActionCodes.PRODUCT_CATEGORY_CREATED,
      entityId: row.id,
      metadata: { slug: row.slug, name: row.name },
    });

    return mapDbProductCategoryToProductCategory(row, 0);
  }

  async update(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    values: ProductCategoryFormValues
  ): Promise<ProductCategory> {
    this.require(session, "edit");
    const row = await this.resolveRow(id);
    await this.assertUniqueName(values.name, row.id);

    const updated = await this.categories.update(row.id, formValuesToUpdate(values));

    await this.log(ctx, session, {
      action: `Updated product category ${updated.name}`,
      actionCode: ActivityActionCodes.PRODUCT_CATEGORY_UPDATED,
      entityId: updated.id,
      metadata: { slug: updated.slug },
    });

    const productCount = await this.categories.getProductCount(updated.id);
    return mapDbProductCategoryToProductCategory(updated, productCount);
  }

  async archive(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<ProductCategory> {
    this.require(session, "edit");
    const row = await this.resolveRow(id);

    if (!row.is_active) {
      throw new ServiceError("Category is already archived.", "VALIDATION", 400);
    }

    const archived = await this.categories.archive(row.id);

    await this.log(ctx, session, {
      action: `Archived product category ${archived.name}`,
      actionCode: ActivityActionCodes.PRODUCT_CATEGORY_ARCHIVED,
      entityId: archived.id,
      metadata: { slug: archived.slug },
    });

    const productCount = await this.categories.getProductCount(archived.id);
    return mapDbProductCategoryToProductCategory(archived, productCount);
  }

  async restore(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<ProductCategory> {
    this.require(session, "edit");
    const row = await this.resolveRow(id);

    if (row.is_active) {
      throw new ServiceError("Category is already active.", "VALIDATION", 400);
    }

    const restored = await this.categories.restore(row.id);

    await this.log(ctx, session, {
      action: `Restored product category ${restored.name}`,
      actionCode: ActivityActionCodes.PRODUCT_CATEGORY_RESTORED,
      entityId: restored.id,
      metadata: { slug: restored.slug },
    });

    const productCount = await this.categories.getProductCount(restored.id);
    return mapDbProductCategoryToProductCategory(restored, productCount);
  }

  async getDeleteBlockers(
    _ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<string[]> {
    this.require(session, "delete");
    const row = await this.resolveRow(id);
    return this.categories.getDeleteBlockers(row.id);
  }

  async delete(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<void> {
    this.require(session, "delete");
    const row = await this.resolveRow(id);
    const blockers = await this.categories.getDeleteBlockers(row.id);
    if (blockers.length > 0) {
      throw new ServiceError(
        `Cannot delete ${row.name}. ${blockers.join("; ")}. Archive instead.`,
        "DELETE_BLOCKED",
        409
      );
    }

    await this.categories.delete(row.id);

    await this.log(ctx, session, {
      action: `Deleted product category ${row.name}`,
      actionCode: ActivityActionCodes.PRODUCT_CATEGORY_DELETED,
      entityId: row.id,
      metadata: { deleted: true, slug: row.slug },
    });
  }

  async reorder(
    ctx: ServiceContext,
    session: AuthSession,
    items: { id: string; displayOrder: number }[]
  ): Promise<void> {
    this.require(session, "manage");
    await this.categories.reorder(items);

    await this.log(ctx, session, {
      action: "Reordered product categories",
      actionCode: ActivityActionCodes.PRODUCT_CATEGORY_UPDATED,
      entityId: items[0]?.id ?? "product_categories",
      metadata: { count: items.length },
    });
  }
}
