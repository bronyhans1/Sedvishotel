"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getReservationService } from "@/lib/reservations/get-reservation-service";

export type CheckInActionResult =
  | { success: true }
  | { success: false; error: string };

export async function completeCheckInAction(
  reservationId: string
): Promise<CheckInActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getReservationService();
    await service.completeCheckIn(ctx, session, reservationId);
    revalidatePath("/dashboard/check-in");
    revalidatePath("/dashboard/stays");
    revalidatePath("/dashboard/check-out");
    revalidatePath("/dashboard/reservations");
    revalidatePath(`/dashboard/reservations/${reservationId}`);
    revalidatePath("/dashboard/rooms");
    revalidatePath("/dashboard/guests");
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
