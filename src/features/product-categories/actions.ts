"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getProductCategoryAccess } from "@/lib/auth/product-category-access";
import { getServiceContext } from "@/lib/auth/service-context";
import { getProductCategoryService } from "@/lib/product-categories/get-product-category-service";
import { ServiceError } from "@/services/types";
import type { ProductCategoryFormValues } from "@/types/product-category";

const CATEGORIES_PATH = "/dashboard/inventory/categories";

export type ProductCategoryActionResult =
  | { success: true }
  | { success: false; error: string; code?: string };

function toActionResult(err: unknown): ProductCategoryActionResult {
  const code = err instanceof ServiceError ? err.code : undefined;
  return {
    success: false,
    error: toSafeActionError(err),
    ...(code ? { code } : {}),
  };
}

export async function createProductCategoryAction(
  values: ProductCategoryFormValues
): Promise<ProductCategoryActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProductCategoryService();
    await service.create(ctx, session, values);
    revalidatePath(CATEGORIES_PATH);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function updateProductCategoryAction(
  id: string,
  values: ProductCategoryFormValues
): Promise<ProductCategoryActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProductCategoryService();
    await service.update(ctx, session, id, values);
    revalidatePath(CATEGORIES_PATH);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function archiveProductCategoryAction(
  id: string
): Promise<ProductCategoryActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProductCategoryService();
    await service.archive(ctx, session, id);
    revalidatePath(CATEGORIES_PATH);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function restoreProductCategoryAction(
  id: string
): Promise<ProductCategoryActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProductCategoryService();
    await service.restore(ctx, session, id);
    revalidatePath(CATEGORIES_PATH);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function deleteProductCategoryAction(
  id: string
): Promise<ProductCategoryActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProductCategoryService();
    await service.delete(ctx, session, id);
    revalidatePath(CATEGORIES_PATH);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function getProductCategoryDeleteBlockersAction(
  id: string
): Promise<{ blockers: string[] }> {
  const { session, ctx } = await getServiceContext();
  const service = await getProductCategoryService();
  const blockers = await service.getDeleteBlockers(ctx, session, id);
  return { blockers };
}

export async function getProductCategoryAccessAction() {
  const { session } = await getServiceContext();
  return getProductCategoryAccess(session);
}
