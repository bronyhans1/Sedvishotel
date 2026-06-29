"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getGuestFolioAccess } from "@/lib/auth/guest-folio-access";
import { getServiceContext } from "@/lib/auth/service-context";
import { getGuestFolioService } from "@/lib/folio/get-guest-folio-service";
import { ServiceError } from "@/services/types";
import type { ManualChargeInput, ManualCreditInput } from "@/types/folio";

const FOLIO_PATH = "/dashboard/guest-folio";

export type FolioActionResult =
  | { success: true }
  | { success: false; error: string; code?: string };

function toActionResult(err: unknown): FolioActionResult {
  const code = err instanceof ServiceError ? err.code : undefined;
  return {
    success: false,
    error: toSafeActionError(err),
    ...(code ? { code } : {}),
  };
}

function revalidateFolioPaths(folioId?: string) {
  revalidatePath(FOLIO_PATH);
  if (folioId) {
    revalidatePath(`${FOLIO_PATH}/${folioId}`);
  }
  revalidatePath("/dashboard/check-out");
  revalidatePath("/dashboard/stays");
}

export async function postManualChargeAction(
  input: ManualChargeInput
): Promise<FolioActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const access = getGuestFolioAccess(session);
    if (!access.canCreate) {
      throw new ServiceError("Forbidden: guest_folio.create required.", "FORBIDDEN", 403);
    }
    const service = await getGuestFolioService();
    await service.postManualCharge(ctx, session, input);
    revalidateFolioPaths(input.folioId);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function postManualCreditAction(
  input: ManualCreditInput
): Promise<FolioActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGuestFolioService();
    await service.postManualCredit(ctx, session, input);
    revalidateFolioPaths(input.folioId);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function closeFolioAction(folioId: string): Promise<FolioActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGuestFolioService();
    await service.closeFolio(ctx, session, folioId);
    revalidateFolioPaths(folioId);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function getFolioBalanceAction(
  reservationId: string
): Promise<{ balance: number }> {
  const { session, ctx } = await getServiceContext();
  const service = await getGuestFolioService();
  const balance = await service.calculateBalance(ctx, session, reservationId);
  return { balance };
}
