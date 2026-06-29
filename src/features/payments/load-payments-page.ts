import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getPaymentAccess } from "@/lib/auth/payment-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import type { AuthoritativeSettlement } from "@/lib/folio/authoritative-settlement";
import { getGuestFolioService } from "@/lib/folio/get-guest-folio-service";
import { getGuestService } from "@/lib/guests/get-guest-service";
import { computePaymentStats } from "@/lib/payments/stats";
import { roundCurrency } from "@/lib/payments/currency";
import { getPaymentService } from "@/lib/payments/get-payment-service";
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

export async function loadPaymentsPageData() {
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

  const [payments, guests, reservations, folioService] = await Promise.all([
    paymentService.getAll(ctx, session),
    guestService.listGuests(ctx, session),
    reservationService.listReservations(ctx, session),
    getGuestFolioService(),
  ]);

  const recordableReservations = reservations.filter(
    (r) => r.status !== "cancelled"
  );

  const stats = computePaymentStats(payments);
  const defaultTaxRate = await getDefaultTaxRate();
  const partialPayments: PartialPaymentContext[] = payments
    .filter((p) => p.status === "partial" && p.balance > 0)
    .map((p) => ({
      reservationId: p.reservationId,
      reference: p.reference,
      totalDue: roundCurrency(p.totalDue),
      amountPaid: roundCurrency(p.netPaid),
      outstandingBalance: roundCurrency(p.balance),
    }));
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

  return { payments, stats, access, recordOptions };
}
