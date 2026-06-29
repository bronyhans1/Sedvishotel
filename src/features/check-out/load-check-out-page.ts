import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getPaymentAccess } from "@/lib/auth/payment-access";
import { getCheckOutAccess } from "@/lib/auth/check-out-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getTodayDateString } from "@/lib/dates/today";
import { getGuestFolioService } from "@/lib/folio/get-guest-folio-service";
import type { AuthoritativeSettlement } from "@/lib/folio/authoritative-settlement";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import {
  getDefaultTaxRate,
  isGlobalVatEnabled,
} from "@/lib/settings/get-tax-rate";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadCheckOutPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getCheckOutAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const paymentAccess = getPaymentAccess(session);
  const defaultTaxRate = await getDefaultTaxRate();

  const today = getTodayDateString();
  const service = await getReservationService();
  const folioService = await getGuestFolioService();

  const [checkedInReservations, stats, checkoutPolicy] = await Promise.all([
    service.listCheckedInReservations(ctx, session),
    service.getCheckOutPageStats(ctx, session, today),
    loadCheckoutPolicy(),
  ]);

  const folioBalances: Record<string, number> = {};
  const folioSettlements: Record<string, AuthoritativeSettlement> = {};
  await Promise.all(
    checkedInReservations.map(async (reservation) => {
      const settlement = await folioService.getAuthoritativeSettlement(
        reservation.id
      );
      if (settlement) {
        folioSettlements[reservation.id] = settlement;
        folioBalances[reservation.id] = settlement.outstandingBalance;
        return;
      }
      folioBalances[reservation.id] = await folioService.calculateBalance(
        ctx,
        session,
        reservation.id
      );
    })
  );

  return {
    checkedInReservations,
    stats,
    access,
    today,
    checkoutPolicy,
    defaultTaxRate,
    defaultVatApplied: isGlobalVatEnabled(defaultTaxRate),
    canOverrideVat: paymentAccess.canOverrideVat,
    canRecordPayment: paymentAccess.canRecord,
    folioBalances,
    folioSettlements,
  };
}
