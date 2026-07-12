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
import { getRoomTypeService } from "@/lib/room-types/get-room-type-service";

export async function loadWalkInPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getWalkInAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const paymentAccess = getPaymentAccess(session);
  const defaultTaxRate = await getDefaultTaxRate();
  const roomTypeService = await getRoomTypeService();
  const roomTypes = (await roomTypeService.list(ctx, session))
    .filter((rt) => rt.status === "active")
    .map((rt) => ({
      name: rt.name,
      defaultPrice: rt.defaultPrice,
      pricingRules: rt.pricingRules,
    }));

  return {
    access,
    defaultTaxRate,
    defaultVatApplied: isGlobalVatEnabled(defaultTaxRate),
    canOverrideVat: paymentAccess.canOverrideVat,
    roomTypes,
  };
}
