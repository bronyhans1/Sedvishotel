"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getPosAccess } from "@/lib/auth/pos-access";
import { getServiceContext } from "@/lib/auth/service-context";
import { getPosService } from "@/lib/pos/get-pos-service";
import { ServiceError } from "@/services/types";
import type { CompletePosSaleInput, PosSale, PosVatOverride } from "@/types/pos";
import type { PosSaleListFilters } from "@/repositories/pos.repository";
import { POS_SALE_HISTORY_PAGE_SIZE } from "@/types/pos";

const POS_PATH = "/dashboard/pos";
const POS_HISTORY_PATH = "/dashboard/pos/history";

export type PosActionResult =
  | { success: true; sale: PosSale; idempotentReplay: boolean }
  | { success: false; error: string; code?: string };

function toActionResult(err: unknown): PosActionResult {
  const code = err instanceof ServiceError ? err.code : undefined;
  return {
    success: false,
    error: toSafeActionError(err),
    ...(code ? { code } : {}),
  };
}

function revalidatePosPaths() {
  revalidatePath(POS_PATH);
  revalidatePath(POS_HISTORY_PATH);
  revalidatePath("/dashboard/inventory/stock");
  revalidatePath("/dashboard/inventory/products");
}

export async function completePosSaleAction(
  input: CompletePosSaleInput,
  vatOverride?: PosVatOverride
): Promise<PosActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const access = getPosAccess(session);
    if (!access.canCreate) {
      throw new ServiceError("Forbidden: pos.create required.", "FORBIDDEN", 403);
    }

    const service = await getPosService();
    const result = await service.completeSale(ctx, session, input, vatOverride);
    revalidatePosPaths();
    return {
      success: true,
      sale: result.sale,
      idempotentReplay: result.idempotentReplay,
    };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function logPosReceiptPrintedAction(saleId: string) {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getPosService();
    await service.logReceiptPrinted(ctx, session, saleId);
    return { success: true as const };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false as const, error: toSafeActionError(err) };
  }
}

export async function logPosReceiptReprintedAction(saleId: string) {
  try {
    const { session, ctx } = await getServiceContext();
    const access = getPosAccess(session);
    if (!access.canView) {
      throw new ServiceError("Forbidden: pos.view required.", "FORBIDDEN", 403);
    }

    const service = await getPosService();
    await service.logReceiptReprinted(ctx, session, saleId);
    return { success: true as const };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false as const, error: toSafeActionError(err) };
  }
}

export async function getPosSaleAction(saleId: string) {
  try {
    const { session, ctx } = await getServiceContext();
    const access = getPosAccess(session);
    if (!access.canView) {
      throw new ServiceError("Forbidden: pos.view required.", "FORBIDDEN", 403);
    }

    const service = await getPosService();
    const sale = await service.getSale(ctx, session, saleId);
    if (!sale) {
      return { success: false as const, error: "Sale not found." };
    }
    return { success: true as const, sale };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false as const, error: toSafeActionError(err) };
  }
}

export async function listPosSalesHistoryAction(
  filters: PosSaleListFilters,
  page = 1
) {
  try {
    const { session, ctx } = await getServiceContext();
    const access = getPosAccess(session);
    if (!access.canView) {
      throw new ServiceError("Forbidden: pos.view required.", "FORBIDDEN", 403);
    }

    const service = await getPosService();
    const result = await service.listSales(ctx, session, filters, {
      page,
      pageSize: POS_SALE_HISTORY_PAGE_SIZE,
    });
    return { success: true as const, ...result };
  } catch (err) {
    unstable_rethrow(err);
    return {
      success: false as const,
      error: toSafeActionError(err),
      data: [],
      total: 0,
      page: 1,
      pageSize: POS_SALE_HISTORY_PAGE_SIZE,
    };
  }
}
