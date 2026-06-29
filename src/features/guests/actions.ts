"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getGuestService } from "@/lib/guests/get-guest-service";
import type { GuestFormValues } from "@/types/guest";

export type GuestActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createGuestAction(
  values: GuestFormValues
): Promise<GuestActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGuestService();
    const created = await service.createGuest(ctx, session, values);
    revalidatePath("/dashboard/guests");
    revalidatePath(`/dashboard/guests/${created.id}`);
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function updateGuestAction(
  guestId: string,
  values: GuestFormValues
): Promise<GuestActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGuestService();
    const updated = await service.updateGuest(ctx, session, guestId, values);
    revalidatePath("/dashboard/guests");
    revalidatePath(`/dashboard/guests/${updated.id}`);
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function archiveGuestAction(
  guestId: string
): Promise<GuestActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGuestService();
    await service.archiveGuest(ctx, session, guestId);
    revalidatePath("/dashboard/guests");
    revalidatePath(`/dashboard/guests/${guestId}`);
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
