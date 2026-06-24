import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getPaymentAccess } from "@/lib/auth/payment-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getGuestService } from "@/lib/guests/get-guest-service";
import { computePaymentStats } from "@/lib/payments/stats";
import { roundCurrency } from "@/lib/payments/currency";
import { getPaymentService } from "@/lib/payments/get-payment-service";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Guest } from "@/types/guest";
import type { Reservation } from "@/types/reservation";

export type PartialPaymentContext = {
  reservationId: string;
  reference: string;
  outstandingBalance: number;
};

export type PaymentRecordOption = {
  guests: Guest[];
  reservations: Reservation[];
  partialPayments: PartialPaymentContext[];
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

  const [payments, guests, reservations] = await Promise.all([
    paymentService.getAll(ctx, session),
    guestService.listGuests(ctx, session),
    reservationService.listReservations(ctx, session),
  ]);

  const recordableReservations = reservations.filter(
    (r) => r.status !== "cancelled"
  );

  const stats = computePaymentStats(payments);
  const partialPayments: PartialPaymentContext[] = payments
    .filter((p) => p.status === "partial" && p.balance > 0)
    .map((p) => ({
      reservationId: p.reservationId,
      reference: p.reference,
      outstandingBalance: roundCurrency(p.balance),
    }));
  const recordOptions: PaymentRecordOption = {
    guests,
    reservations: recordableReservations,
    partialPayments,
  };

  return { payments, stats, access, recordOptions };
}
