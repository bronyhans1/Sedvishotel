"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getPaymentService } from "@/lib/payments/get-payment-service";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { SupabasePaymentRepository } from "@/repositories/supabase/payment.repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import type { ExtendStayInput, ExtendStayPreview } from "@/types/extend-stay";
import type { RoomMoveInput, RoomMovePreview } from "@/types/room-move";

export type StayActionResult =
  | { success: true }
  | { success: false; error: string };

function revalidateStayPaths(reservationId: string) {
  revalidatePath("/dashboard/stays");
  revalidatePath("/dashboard/reservations");
  revalidatePath(`/dashboard/reservations/${reservationId}`);
  revalidatePath("/dashboard/check-out");
  revalidatePath("/dashboard/rooms");
  revalidatePath("/dashboard/housekeeping");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/invoices");
  revalidateDashboardWidgets();
}

export async function previewExtendStayAction(
  reservationId: string,
  newCheckOutDate: string
): Promise<ExtendStayPreview | null> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getReservationService();
    return await service.previewExtendStay(ctx, session, reservationId, newCheckOutDate);
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
}

export async function completeExtendStayAction(
  reservationId: string,
  input: ExtendStayInput
): Promise<StayActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const client = supabaseEnv.serviceRoleKey
      ? createAdminClient()
      : await createServerClient();
    const service = await getReservationService();
    const paymentService = await getPaymentService();
    const payments = new SupabasePaymentRepository(client);

    await service.completeExtendStay(
      ctx,
      session,
      reservationId,
      input,
      paymentService,
      payments
    );
    revalidateStayPaths(reservationId);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function previewRoomMoveAction(
  reservationId: string,
  newRoomNumber?: string
): Promise<RoomMovePreview | null> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getReservationService();
    return await service.previewRoomMove(ctx, session, reservationId, newRoomNumber);
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
}

export async function completeRoomMoveAction(
  reservationId: string,
  input: RoomMoveInput
): Promise<StayActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const client = supabaseEnv.serviceRoleKey
      ? createAdminClient()
      : await createServerClient();
    const service = await getReservationService();
    const paymentService = await getPaymentService();
    const payments = new SupabasePaymentRepository(client);

    await service.completeRoomMove(
      ctx,
      session,
      reservationId,
      input,
      paymentService,
      payments
    );
    revalidateStayPaths(reservationId);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
