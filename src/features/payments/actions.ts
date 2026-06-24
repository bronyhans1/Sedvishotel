"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getPaymentService } from "@/lib/payments/get-payment-service";
import type { PaymentFormValues, RefundFormValues } from "@/types/payment";

export type PaymentActionResult =
  | { success: true; paymentId?: string }
  | { success: false; error: string };

export async function recordPaymentAction(
  values: PaymentFormValues
): Promise<PaymentActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getPaymentService();
    const payment = await service.create(ctx, session, values);
    revalidatePath("/dashboard/payments");
    revalidatePath(`/dashboard/payments/${payment.id}`);
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/revenue");
    revalidateDashboardWidgets();
    return { success: true, paymentId: payment.id };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function refundPaymentAction(
  paymentId: string,
  values: RefundFormValues
): Promise<PaymentActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getPaymentService();
    const payment = await service.refund(ctx, session, paymentId, values);
    revalidatePath("/dashboard/payments");
    revalidatePath(`/dashboard/payments/${payment.id}`);
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/revenue");
    revalidateDashboardWidgets();
    return { success: true, paymentId: payment.id };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
