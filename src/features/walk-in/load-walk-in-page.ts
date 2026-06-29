import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getPaymentAccess } from "@/lib/auth/payment-access";
import { getWalkInAccess } from "@/lib/auth/walk-in-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import {
  getDefaultTaxRate,
  isGlobalVatEnabled,
} from "@/lib/settings/get-tax-rate";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadWalkInPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session } = await getServiceContextForPage();

  const access = getWalkInAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const paymentAccess = getPaymentAccess(session);
  const defaultTaxRate = await getDefaultTaxRate();

  return {
    access,
    defaultTaxRate,
    defaultVatApplied: isGlobalVatEnabled(defaultTaxRate),
    canOverrideVat: paymentAccess.canOverrideVat,
  };
}
