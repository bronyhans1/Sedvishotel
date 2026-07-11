import { nightsBetween } from "@/lib/utils";
import type { Guest } from "@/types/guest";
import type { Reservation, ReservationStatus } from "@/types/reservation";

const COMPLETED_STAY_STATUSES: ReservationStatus[] = [
  "checked_out",
  "checked_out_early",
];

export type GuestProfileInsights = {
  returningGuest: boolean;
  totalVisits: number;
  currentStatus: Guest["guestStatus"];
  firstStay: string | null;
  lastStay: string | null;
  currentReservationNumber: string | null;
  currentRoom: string | null;
  totalNightsStayed: number;
  lifetimeAccommodationSpend: number;
  lifetimePosSpend: number;
  lifetimeTotalSpend: number;
  preferredRoomType: string | null;
  preferredPaymentMethod: string | null;
};

function isCompletedStay(status: ReservationStatus): boolean {
  return COMPLETED_STAY_STATUSES.includes(status);
}

function mode(values: string[]): string | null {
  if (!values.length) return null;
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
  mixed: "Mixed",
};

function formatPaymentMethod(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method.replace(/_/g, " ");
}

export function computeGuestProfileInsights(
  guest: Guest,
  reservations: Reservation[],
  lifetimePosSpend: number,
  paymentMethods: string[]
): GuestProfileInsights {
  const completedStays = reservations.filter((reservation) =>
    isCompletedStay(reservation.status)
  );

  const totalNightsStayed = completedStays.reduce(
    (sum, reservation) =>
      sum + nightsBetween(reservation.checkInDate, reservation.checkOutDate),
    0
  );

  const lifetimeAccommodationSpend = completedStays.reduce(
    (sum, reservation) => sum + reservation.amountPaid,
    0
  );

  const sortedCompleted = [...completedStays].sort((a, b) =>
    a.checkInDate.localeCompare(b.checkInDate)
  );

  const activeReservation =
    reservations.find((reservation) => reservation.status === "checked_in") ??
    reservations.find(
      (reservation) =>
        reservation.status === "confirmed" || reservation.status === "pending"
    ) ??
    null;

  return {
    returningGuest: guest.totalVisits > 1,
    totalVisits: guest.totalVisits,
    currentStatus: guest.guestStatus,
    firstStay: sortedCompleted[0]?.checkInDate ?? null,
    lastStay:
      sortedCompleted[sortedCompleted.length - 1]?.checkOutDate ?? null,
    currentReservationNumber: activeReservation?.reservationNumber ?? null,
    currentRoom:
      guest.guestStatus === "in_house"
        ? activeReservation?.roomNumber ?? null
        : null,
    totalNightsStayed,
    lifetimeAccommodationSpend,
    lifetimePosSpend,
    lifetimeTotalSpend: lifetimeAccommodationSpend + lifetimePosSpend,
    preferredRoomType: mode(
      completedStays
        .map((reservation) => reservation.roomTypeName)
        .filter(Boolean)
    ),
    preferredPaymentMethod: paymentMethods.length
      ? formatPaymentMethod(mode(paymentMethods) ?? paymentMethods[0])
      : null,
  };
}
