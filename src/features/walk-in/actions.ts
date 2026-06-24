"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getWalkInService } from "@/lib/walk-in/get-walk-in-service";
import type { WalkInFormValues, WalkInRoomOption } from "@/types/walk-in";

export type WalkInActionResult =
  | { success: true; guestId: string; reservationId: string; paymentId?: string }
  | { success: false; error: string };

export async function getWalkInAvailableRoomsAction(
  checkIn: string,
  checkOut: string
): Promise<WalkInRoomOption[]> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getWalkInService();
    return service.getAvailableRooms(ctx, session, checkIn, checkOut);
  } catch (err) {
    unstable_rethrow(err);
    return [];
  }
}

export async function completeWalkInAction(
  values: WalkInFormValues
): Promise<WalkInActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getWalkInService();
    const result = await service.completeWalkIn(ctx, session, values);
    revalidatePath("/dashboard/walk-in");
    revalidatePath("/dashboard/guests");
    revalidatePath(`/dashboard/guests/${result.guestId}`);
    revalidatePath("/dashboard/reservations");
    revalidatePath(`/dashboard/reservations/${result.reservationId}`);
    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/rooms");
    revalidatePath("/dashboard/housekeeping");
    revalidatePath("/dashboard/stays");
    revalidatePath("/dashboard/check-in");
    revalidateDashboardWidgets();
    return { success: true, ...result };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
