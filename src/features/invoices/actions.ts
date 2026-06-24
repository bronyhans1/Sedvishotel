"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getInvoiceService } from "@/lib/invoices/get-invoice-service";

export type InvoiceActionResult =
  | { success: true; invoiceId?: string }
  | { success: false; error: string };

export async function generateInvoiceAction(
  reservationId: string
): Promise<InvoiceActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getInvoiceService();
    const invoice = await service.create(ctx, session, reservationId);
    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${invoice.id}`);
    revalidateDashboardWidgets();
    return { success: true, invoiceId: invoice.id };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function markInvoicePaidAction(
  invoiceId: string
): Promise<InvoiceActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getInvoiceService();
    const invoice = await service.markPaid(ctx, session, invoiceId);
    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${invoice.id}`);
    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/payments");
    revalidateDashboardWidgets();
    return { success: true, invoiceId: invoice.id };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
