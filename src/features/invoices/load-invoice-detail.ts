import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getInvoiceAccess } from "@/lib/auth/invoice-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { loadHotelDocumentSettings } from "@/lib/documents/load-document-settings";
import { getInvoiceService } from "@/lib/invoices/get-invoice-service";
import { getPaymentService } from "@/lib/payments/get-payment-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadInvoiceDetail(id: string) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getInvoiceAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const invoiceService = await getInvoiceService();
  const paymentService = await getPaymentService();
  const invoice = await invoiceService.getById(ctx, session, id);

  if (!invoice) {
    notFound();
  }

  const [{ invoiceDocumentSettings, receiptBranding }, payment] =
    await Promise.all([
      loadHotelDocumentSettings(),
      paymentService.getByReservationId(ctx, session, invoice.reservationId),
    ]);

  return {
    invoice,
    access,
    documentSettings: invoiceDocumentSettings,
    payment,
    receiptBranding,
  };
}
