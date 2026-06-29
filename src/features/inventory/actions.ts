"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getInventoryAccess } from "@/lib/auth/inventory-access";
import { getServiceContext } from "@/lib/auth/service-context";
import { getInventoryService } from "@/lib/inventory/get-inventory-service";
import { ServiceError } from "@/services/types";
import type {
  OpeningBalanceInput,
  StockAdjustmentInput,
  StockMovementInput,
} from "@/types/inventory";

const STOCK_PATH = "/dashboard/inventory/stock";
const PRODUCTS_PATH = "/dashboard/inventory/products";

export type InventoryActionResult =
  | { success: true }
  | { success: false; error: string; code?: string };

function toActionResult(err: unknown): InventoryActionResult {
  const code = err instanceof ServiceError ? err.code : undefined;
  return {
    success: false,
    error: toSafeActionError(err),
    ...(code ? { code } : {}),
  };
}

function revalidateInventoryPaths() {
  revalidatePath(STOCK_PATH);
  revalidatePath(PRODUCTS_PATH);
  revalidatePath("/dashboard/inventory/categories");
}

export async function openingBalanceAction(
  input: OpeningBalanceInput
): Promise<InventoryActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getInventoryService();
    await service.openingBalance(ctx, session, input);
    revalidateInventoryPaths();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function stockInAction(
  input: StockMovementInput
): Promise<InventoryActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getInventoryService();
    await service.stockIn(ctx, session, input);
    revalidateInventoryPaths();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function stockOutAction(
  input: StockMovementInput
): Promise<InventoryActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getInventoryService();
    await service.stockOut(ctx, session, input);
    revalidateInventoryPaths();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function adjustStockAction(
  input: StockAdjustmentInput
): Promise<InventoryActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getInventoryService();
    await service.adjustStock(ctx, session, input);
    revalidateInventoryPaths();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function getInventoryAccessAction() {
  const { session } = await getServiceContext();
  return getInventoryAccess(session);
}
