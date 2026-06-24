import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getInvoiceAccess } from "@/lib/auth/invoice-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getInvoiceService } from "@/lib/invoices/get-invoice-service";
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

  const service = await getInvoiceService();
  const invoice = await service.getById(ctx, session, id);

  if (!invoice) {
    notFound();
  }

  return { invoice, access };
}
