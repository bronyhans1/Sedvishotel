import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getPaymentAccess } from "@/lib/auth/payment-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import type { AuthoritativeSettlement } from "@/lib/folio/authoritative-settlement";
import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { getGuestFolioService } from "@/lib/folio/get-guest-folio-service";
import { getGuestService } from "@/lib/guests/get-guest-service";
import { loadHotelDocumentSettings } from "@/lib/documents/load-document-settings";
import { getPaymentService } from "@/lib/payments/get-payment-service";
import { parsePageParam } from "@/lib/pagination/pagination";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { getDefaultTaxRate, isGlobalVatEnabled } from "@/lib/settings/get-tax-rate";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Guest } from "@/types/guest";
import type { Reservation } from "@/types/reservation";

export type PartialPaymentContext = {
  reservationId: string;
  reference: string;
  totalDue: number;
  amountPaid: number;
  outstandingBalance: number;
};

export type PaymentRecordOption = {
  guests: Guest[];
  reservations: Reservation[];
  partialPayments: PartialPaymentContext[];
  folioSettlements: Record<string, AuthoritativeSettlement>;
  defaultTaxRate: number;
  defaultVatApplied: boolean;
};

export async function loadPaymentsPageData(
  params: Record<string, string | string[] | undefined> = {}
) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getPaymentAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const paymentService = await getPaymentService();
  const guestService = await getGuestService();
  const reservationService = await getReservationService();

  const requestedPage = parsePageParam(params.page);
  const search = typeof params.search === "string" ? params.search : "";

  const [
    paymentPage,
    summary,
    guests,
    reservations,
    folioService,
    documentSettings,
    businessDate,
  ] = await Promise.all([
      paymentService.listPaymentPage(ctx, session, {
        page: requestedPage,
        search,
      }),
      paymentService.getOperationalPaymentSummary(ctx, session),
      guestService.listGuests(ctx, session),
      reservationService.listReservations(ctx, session),
      getGuestFolioService(),
      loadHotelDocumentSettings(),
      getCurrentBusinessDate(),
    ]);

  if (paymentPage.page !== requestedPage) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || key === "search") continue;
      if (typeof value === "string" && value) qs.set(key, value);
    }
    if (paymentPage.search) qs.set("search", paymentPage.search);
    if (paymentPage.page > 1) qs.set("page", String(paymentPage.page));
    const query = qs.toString();
    redirect(query ? `/dashboard/payments?${query}` : "/dashboard/payments");
  }

  const recordableReservations = reservations.filter(
    (r) => r.status !== "cancelled"
  );

  const { stats, partialPayments } = summary;
  const defaultTaxRate = await getDefaultTaxRate();
  const folioSettlements: Record<string, AuthoritativeSettlement> = {};
  await Promise.all(
    recordableReservations
      .filter((r) => r.status === "checked_in")
      .map(async (reservation) => {
        const settlement = await folioService.getAuthoritativeSettlement(
          reservation.id
        );
        if (settlement) {
          folioSettlements[reservation.id] = settlement;
        }
      })
  );

  const recordOptions: PaymentRecordOption = {
    guests,
    reservations: recordableReservations,
    partialPayments,
    folioSettlements,
    defaultTaxRate,
    defaultVatApplied: isGlobalVatEnabled(defaultTaxRate),
  };

  return {
    payments: paymentPage.payments,
    total: paymentPage.total,
    page: paymentPage.page,
    pageSize: paymentPage.pageSize,
    search: paymentPage.search,
    stats,
    access,
    recordOptions,
    receiptBranding: documentSettings.receiptBranding,
    businessDate,
  };
}
