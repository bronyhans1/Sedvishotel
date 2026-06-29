import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getPaymentAccess } from "@/lib/auth/payment-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
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
  const payment = await service.getById(ctx, session, id);

  if (!payment) {
    notFound();
  }

  return { payment, access };
}
