import type { ReservationStatus } from "@/types/reservation";

/**
 * Operational presentation order for Record Payment.
 * This does not decide whether a payment is allowed.
 */
export type RecordPaymentGroupId =
  | "in_house"
  | "upcoming"
  | "departed_balance"
  | "other";

export const RECORD_PAYMENT_GROUP_LABELS: Record<RecordPaymentGroupId, string> = {
  in_house: "CURRENT IN-HOUSE",
  upcoming: "UPCOMING PAYABLE",
  departed_balance: "DEPARTED WITH BALANCE",
  other: "OTHER ELIGIBLE",
};

const GROUP_ORDER: RecordPaymentGroupId[] = [
  "in_house",
  "upcoming",
  "departed_balance",
  "other",
];

export type RecordPaymentReservationRef = {
  id: string;
  guestId: string;
  status: ReservationStatus;
  checkInDate: string;
  checkOutDate: string;
  actualCheckOutDate?: string | null;
  roomNumber: string;
  guestName: string;
  reservationNumber: string;
};

export type RecordPaymentSelectionGroup<T> = {
  id: RecordPaymentGroupId;
  label: string;
  items: T[];
};

function dateOnly(value: string | null | undefined): string {
  return (value ?? "").slice(0, 10);
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function departureDate(reservation: RecordPaymentReservationRef): string {
  return dateOnly(reservation.actualCheckOutDate) || dateOnly(reservation.checkOutDate);
}

/**
 * Checked-in stays stay in house even when the departure date is already past.
 * Pending and confirmed stays remain upcoming while their departure date is
 * still on or after the business date. Cancelled stays are omitted.
 */
export function classifyRecordPaymentReservation(
  reservation: Pick<RecordPaymentReservationRef, "status" | "checkOutDate">,
  outstandingBalance: number,
  businessDate: string
): RecordPaymentGroupId | null {
  if (reservation.status === "cancelled") return null;
  if (reservation.status === "checked_in") return "in_house";
  if (
    (reservation.status === "pending" || reservation.status === "confirmed") &&
    dateOnly(reservation.checkOutDate) >= businessDate
  ) {
    return "upcoming";
  }
  if (
    (reservation.status === "checked_out" ||
      reservation.status === "checked_out_early") &&
    outstandingBalance > 0
  ) {
    return "departed_balance";
  }
  return "other";
}

function compareInGroup(
  group: RecordPaymentGroupId,
  a: RecordPaymentReservationRef,
  b: RecordPaymentReservationRef
): number {
  if (group === "in_house") {
    return (
      compareText(a.roomNumber, b.roomNumber) ||
      compareText(a.guestName, b.guestName) ||
      compareText(a.reservationNumber, b.reservationNumber)
    );
  }
  if (group === "upcoming") {
    return (
      dateOnly(a.checkInDate).localeCompare(dateOnly(b.checkInDate)) ||
      compareText(a.reservationNumber, b.reservationNumber) ||
      compareText(a.guestName, b.guestName)
    );
  }
  return (
    departureDate(b).localeCompare(departureDate(a)) ||
    compareText(a.guestName, b.guestName) ||
    compareText(a.reservationNumber, b.reservationNumber)
  );
}

export function groupRecordPaymentReservations<T extends RecordPaymentReservationRef>(
  reservations: readonly T[],
  outstandingBalance: (reservation: T) => number,
  businessDate: string
): RecordPaymentSelectionGroup<T>[] {
  const buckets = new Map<RecordPaymentGroupId, T[]>();
  for (const reservation of reservations) {
    const group = classifyRecordPaymentReservation(
      reservation,
      outstandingBalance(reservation),
      businessDate
    );
    if (!group) continue;
    const list = buckets.get(group) ?? [];
    list.push(reservation);
    buckets.set(group, list);
  }

  return GROUP_ORDER.flatMap((id) => {
    const items = buckets.get(id);
    if (!items?.length) return [];
    items.sort((a, b) => compareInGroup(id, a, b));
    return [{ id, label: RECORD_PAYMENT_GROUP_LABELS[id], items }];
  });
}

export function groupRecordPaymentGuests<
  G extends { id: string; fullName: string },
  R extends RecordPaymentReservationRef,
>(
  guests: readonly G[],
  reservations: readonly R[],
  outstandingBalance: (reservation: R) => number,
  businessDate: string
): RecordPaymentSelectionGroup<G>[] {
  const bestRank = new Map<string, number>();
  for (const reservation of reservations) {
    const group = classifyRecordPaymentReservation(
      reservation,
      outstandingBalance(reservation),
      businessDate
    );
    if (!group) continue;
    const rank = GROUP_ORDER.indexOf(group);
    const current = bestRank.get(reservation.guestId);
    if (current == null || rank < current) bestRank.set(reservation.guestId, rank);
  }

  const buckets = new Map<RecordPaymentGroupId, G[]>();
  for (const guest of guests) {
    const rank = bestRank.get(guest.id) ?? GROUP_ORDER.indexOf("other");
    const id = GROUP_ORDER[rank] ?? "other";
    const list = buckets.get(id) ?? [];
    list.push(guest);
    buckets.set(id, list);
  }

  return GROUP_ORDER.flatMap((id) => {
    const items = buckets.get(id);
    if (!items?.length) return [];
    items.sort((a, b) => compareText(a.fullName, b.fullName));
    return [{ id, label: RECORD_PAYMENT_GROUP_LABELS[id], items }];
  });
}
