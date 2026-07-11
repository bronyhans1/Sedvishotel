import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getPaymentAccess } from "@/lib/auth/payment-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { loadHotelDocumentSettings } from "@/lib/documents/load-document-settings";
import { getPaymentService } from "@/lib/payments/get-payment-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadPaymentDetail(id: string) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getPaymentAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getPaymentService();
  const [payment, documentSettings, printHistory] = await Promise.all([
    service.getById(ctx, session, id),
    loadHotelDocumentSettings(),
    service.getReceiptPrintHistory(ctx, session, id),
  ]);

  if (!payment) {
    notFound();
  }

  return {
    payment,
    access,
    receiptBranding: documentSettings.receiptBranding,
    printHistory,
  };
}
