"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateGroupReservationPaths } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getCorporateAccountService } from "@/lib/corporate/get-corporate-account-service";
import type { CorporateAccountFormValues } from "@/types/corporate-account";

export type CorporateActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

export async function createCorporateAccountAction(
  values: CorporateAccountFormValues
): Promise<CorporateActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getCorporateAccountService();
    const account = await service.createCompany(ctx, session, values);
    revalidateGroupReservationPaths();
    revalidatePath(`/dashboard/corporate-accounts/${account.id}`);
    return { success: true, id: account.id };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function updateCorporateAccountAction(
  id: string,
  values: CorporateAccountFormValues
): Promise<CorporateActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getCorporateAccountService();
    await service.updateCompany(ctx, session, id, values);
    revalidateGroupReservationPaths();
    revalidatePath(`/dashboard/corporate-accounts/${id}`);
    return { success: true, id };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function archiveCorporateAccountAction(
  id: string
): Promise<CorporateActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getCorporateAccountService();
    await service.archiveCompany(ctx, session, id);
    revalidateGroupReservationPaths();
    revalidatePath(`/dashboard/corporate-accounts/${id}`);
    return { success: true, id };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
