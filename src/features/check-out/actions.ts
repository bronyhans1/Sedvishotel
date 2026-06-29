"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getPaymentService } from "@/lib/payments/get-payment-service";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import type { PaymentFormValues } from "@/types/payment";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import { SupabasePaymentRepository } from "@/repositories/supabase/payment.repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import type { EarlyCheckOutInput, EarlyCheckOutPreview } from "@/types/early-checkout";
import type { LateCheckOutInput, LateCheckOutPreview } from "@/types/late-checkout";

export type CheckOutActionResult =
  | { success: true }
  | { success: false; error: string };

export type EarlyCheckOutActionResult =
  | { success: true }
  | { success: false; error: string };

export type LateCheckOutActionResult =
  | { success: true }
  | { success: false; error: string };

function revalidateCheckoutPaths(reservationId: string) {
  revalidatePath("/dashboard/check-out");
  revalidatePath("/dashboard/stays");
  revalidatePath("/dashboard/check-in");
  revalidatePath("/dashboard/reservations");
  revalidatePath(`/dashboard/reservations/${reservationId}`);
  revalidatePath("/dashboard/rooms");
  revalidatePath("/dashboard/guests");
  revalidatePath("/dashboard/housekeeping");
  revalidatePath("/dashboard/payments");
  revalidateDashboardWidgets();
}

export async function completeCheckOutAction(
  reservationId: string,
  payment?: PaymentFormValues
): Promise<CheckOutActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const reservationService = await getReservationService();
    const paymentService = await getPaymentService();

    await reservationService.completeCheckOutWithSettlement(
      ctx,
      session,
      reservationId,
      paymentService,
      payment
    );
    revalidateCheckoutPaths(reservationId);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function previewEarlyCheckOutAction(
  reservationId: string,
  actualCheckOutDate?: string
): Promise<EarlyCheckOutPreview | null> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getReservationService();
    return await service.previewEarlyCheckOut(
      ctx,
      session,
      reservationId,
      actualCheckOutDate
    );
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
}

export async function completeEarlyCheckOutAction(
  reservationId: string,
  input: EarlyCheckOutInput
): Promise<EarlyCheckOutActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const client = supabaseEnv.serviceRoleKey
      ? createAdminClient()
      : await createServerClient();
    const service = await getReservationService();
    const paymentService = await getPaymentService();
    const payments = new SupabasePaymentRepository(client);

    await service.completeEarlyCheckOut(
      ctx,
      session,
      reservationId,
      input,
      paymentService,
      payments
    );
    revalidateCheckoutPaths(reservationId);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function previewLateCheckOutAction(
  reservationId: string,
  actualCheckoutTime?: string,
  complimentary?: boolean
): Promise<LateCheckOutPreview | null> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getReservationService();
    const policy = await loadCheckoutPolicy();
    return await service.previewLateCheckOut(
      ctx,
      session,
      reservationId,
      policy,
      actualCheckoutTime,
      complimentary
    );
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
}

export async function completeLateCheckOutAction(
  reservationId: string,
  input: LateCheckOutInput
): Promise<LateCheckOutActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const client = supabaseEnv.serviceRoleKey
      ? createAdminClient()
      : await createServerClient();
    const service = await getReservationService();
    const paymentService = await getPaymentService();
    const payments = new SupabasePaymentRepository(client);
    const policy = await loadCheckoutPolicy();

    await service.completeLateCheckOut(
      ctx,
      session,
      reservationId,
      input,
      policy,
      paymentService,
      payments
    );
    revalidateCheckoutPaths(reservationId);
    revalidatePath("/dashboard/invoices");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
