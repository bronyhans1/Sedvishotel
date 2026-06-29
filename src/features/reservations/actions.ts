"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import type { ReservationFormValues } from "@/types/reservation";

export type ReservationActionResult =
  | { success: true }
  | { success: false; error: string };

export type AvailabilityActionResult =
  | { success: true; rooms: Awaited<ReturnType<Awaited<ReturnType<typeof getReservationService>>["checkAvailability"]>> }
  | { success: false; error: string };

export async function createReservationAction(
  values: ReservationFormValues
): Promise<ReservationActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getReservationService();
    const created = await service.createReservation(ctx, session, values);
    revalidatePath("/dashboard/reservations");
    revalidatePath(`/dashboard/reservations/${created.id}`);
    revalidatePath("/dashboard/rooms");
    revalidatePath("/dashboard/guests");
    revalidatePath("/dashboard/check-in");
    revalidatePath("/dashboard/stays");
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function updateReservationAction(
  id: string,
  values: ReservationFormValues
): Promise<ReservationActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getReservationService();
    const updated = await service.updateReservation(ctx, session, id, values);
    revalidatePath("/dashboard/reservations");
    revalidatePath(`/dashboard/reservations/${updated.id}`);
    revalidatePath("/dashboard/rooms");
    revalidatePath("/dashboard/guests");
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function cancelReservationAction(
  id: string,
  reason?: string
): Promise<ReservationActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getReservationService();
    await service.cancelReservation(ctx, session, id, reason);
    revalidatePath("/dashboard/reservations");
    revalidatePath(`/dashboard/reservations/${id}`);
    revalidatePath("/dashboard/rooms");
    revalidatePath("/dashboard/check-in");
    revalidatePath("/dashboard/check-out");
    revalidatePath("/dashboard/stays");
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function checkAvailabilityAction(
  checkIn: string,
  checkOut: string,
  roomTypeId?: string,
  excludeReservationId?: string
): Promise<AvailabilityActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getReservationService();
    const rooms = await service.checkAvailability(ctx, session, {
      checkIn,
      checkOut,
      roomTypeId,
      excludeReservationId,
    });
    return { success: true, rooms };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
