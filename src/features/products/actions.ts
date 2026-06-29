"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getProductAccess } from "@/lib/auth/product-access";
import { sessionHasPermission } from "@/lib/auth/permissions";
import { getServiceContext } from "@/lib/auth/service-context";
import { getProductService } from "@/lib/products/get-product-service";
import {
  removeProductImage,
  uploadProductImage,
} from "@/lib/products/product-image-storage";
import { SupabaseProductRepository } from "@/repositories/supabase/product.repository";
import { ServiceError } from "@/services/types";
import type { ProductFormValues } from "@/types/product";

const PRODUCTS_PATH = "/dashboard/inventory/products";
const CATEGORIES_PATH = "/dashboard/inventory/categories";

export type ProductActionResult =
  | { success: true; productId?: string }
  | { success: false; error: string; code?: string };

function toActionResult(err: unknown): ProductActionResult {
  const code = err instanceof ServiceError ? err.code : undefined;
  return {
    success: false,
    error: toSafeActionError(err),
    ...(code ? { code } : {}),
  };
}

function revalidateProductPaths() {
  revalidatePath(PRODUCTS_PATH);
  revalidatePath(CATEGORIES_PATH);
}

export async function createProductAction(
  values: ProductFormValues
): Promise<ProductActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProductService();
    const created = await service.create(ctx, session, values);
    revalidateProductPaths();
    return { success: true, productId: created.id };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function updateProductAction(
  id: string,
  values: ProductFormValues
): Promise<ProductActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProductService();
    await service.update(ctx, session, id, values);
    revalidateProductPaths();
    return { success: true, productId: id };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function archiveProductAction(
  id: string
): Promise<ProductActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProductService();
    await service.archive(ctx, session, id);
    revalidateProductPaths();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function restoreProductAction(
  id: string
): Promise<ProductActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProductService();
    await service.restore(ctx, session, id);
    revalidateProductPaths();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function deleteProductAction(
  id: string
): Promise<ProductActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProductService();
    await service.delete(ctx, session, id);
    revalidateProductPaths();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function uploadProductImageAction(
  productId: string,
  formData: FormData
): Promise<ProductActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    if (!sessionHasPermission(session, "products", "edit")) {
      throw new ServiceError(
        "Forbidden: missing permission products.edit",
        "FORBIDDEN",
        403
      );
    }

    const service = await getProductService();
    const product = await service.getById(ctx, session, productId);
    if (!product) {
      throw new ServiceError("Product not found.", "NOT_FOUND", 404);
    }

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      throw new ServiceError("Image file is required.", "VALIDATION", 400);
    }

    const client = service.getClient();
    const path = await uploadProductImage(client, productId, file);
    await new SupabaseProductRepository(client).updateImageUrl(productId, path);

    revalidateProductPaths();
    return { success: true, productId };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function removeProductImageAction(
  productId: string
): Promise<ProductActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    if (!sessionHasPermission(session, "products", "edit")) {
      throw new ServiceError(
        "Forbidden: missing permission products.edit",
        "FORBIDDEN",
        403
      );
    }

    const service = await getProductService();
    const product = await service.getById(ctx, session, productId);
    if (!product) {
      throw new ServiceError("Product not found.", "NOT_FOUND", 404);
    }

    const client = service.getClient();
    const repo = new SupabaseProductRepository(client);
    const row = await repo.getById(productId);
    if (row?.image_url && !row.image_url.startsWith("http")) {
      await removeProductImage(client, row.image_url);
    }

    await repo.updateImageUrl(productId, null);
    revalidateProductPaths();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function getProductAccessAction() {
  const { session } = await getServiceContext();
  return getProductAccess(session);
}
