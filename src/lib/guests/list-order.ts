import type { GuestStats, GuestStatus } from "@/types/guest";
import type { ReservationStatus } from "@/types/reservation";

export type GuestListFilters = {
  search: string;
  status: GuestStatus | "all";
};

/** Lean guest fields the directory filter, KPIs, and sort actually read. */
export type GuestListKey = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  guestStatus: GuestStatus;
  totalVisits: number;
  vipStatus: boolean;
};

/** Lean reservation fields used only to rank a guest. Not written back. */
export type GuestListReservation = {
  id: string;
  guestId: string;
  status: ReservationStatus;
  checkInDate: string;
  checkOutDate: string;
  actualCheckOutDate: string | null;
  reservationNumber: string;
  roomNumber: string;
};

export type GuestListStay = {
  guestId: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber: string;
};

export type ClassifiedGuestListKey = GuestListKey & {
  rank: 0 | 1 | 2;
  roomNumber: string;
  sortDate: string;
  stay: GuestListStay | null;
};

export type GuestDirectoryStats = Pick<
  GuestStats,
  "totalGuests" | "currentGuests" | "returningGuests" | "vipGuests"
>;

function dateOnly(value: string | null | undefined): string {
  return (value ?? "").slice(0, 10);
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Same predicate the guests screen used in the browser.
 * Name and email are case-insensitive. Phone is matched against the
 * lowercased term without lowercasing the stored phone.
 */
export function guestMatchesListFilters(
  guest: Pick<GuestListKey, "fullName" | "email" | "phone" | "guestStatus">,
  params: GuestListFilters
): boolean {
  if (params.status !== "all" && guest.guestStatus !== params.status) return false;
  const search = params.search.trim().toLowerCase();
  if (!search) return true;
  return (
    guest.fullName.toLowerCase().includes(search) ||
    guest.email.toLowerCase().includes(search) ||
    guest.phone.includes(search)
  );
}

/**
 * Directory KPIs from the full non-archived guest set.
 * `currentGuests` is stored `guest_status === "in_house"`, not reservation state.
 */
export function summarizeGuestDirectoryStats(
  guests: readonly Pick<GuestListKey, "guestStatus" | "totalVisits" | "vipStatus">[]
): GuestDirectoryStats {
  return {
    totalGuests: guests.length,
    currentGuests: guests.filter((guest) => guest.guestStatus === "in_house").length,
    returningGuests: guests.filter((guest) => guest.totalVisits > 1).length,
    vipGuests: guests.filter((guest) => guest.vipStatus).length,
  };
}

function isUpcoming(reservation: GuestListReservation, businessDate: string): boolean {
  if (reservation.status !== "pending" && reservation.status !== "confirmed") {
    return false;
  }
  return dateOnly(reservation.checkInDate) >= businessDate;
}

function historyRecency(reservation: GuestListReservation): string {
  const actual = dateOnly(reservation.actualCheckOutDate);
  if (actual) return actual;
  if (
    reservation.status === "checked_out" ||
    reservation.status === "checked_out_early"
  ) {
    return dateOnly(reservation.checkOutDate);
  }
  return dateOnly(reservation.checkInDate);
}

function compareCheckedIn(a: GuestListReservation, b: GuestListReservation): number {
  return (
    compareText(a.roomNumber, b.roomNumber) ||
    compareText(a.reservationNumber, b.reservationNumber) ||
    a.id.localeCompare(b.id)
  );
}

function compareUpcoming(a: GuestListReservation, b: GuestListReservation): number {
  return (
    dateOnly(a.checkInDate).localeCompare(dateOnly(b.checkInDate)) ||
    compareText(a.reservationNumber, b.reservationNumber) ||
    a.id.localeCompare(b.id)
  );
}

export function classifyGuest(
  guest: GuestListKey,
  reservations: readonly GuestListReservation[],
  businessDate: string
): ClassifiedGuestListKey {
  const own = reservations.filter((reservation) => reservation.guestId === guest.id);
  const checkedIn = own
    .filter((reservation) => reservation.status === "checked_in")
    .sort(compareCheckedIn);
  const inHouse = checkedIn[0];
  if (inHouse) {
    return {
      ...guest,
      rank: 0,
      roomNumber: inHouse.roomNumber,
      sortDate: "",
      stay: {
        guestId: guest.id,
        status: inHouse.status,
        checkInDate: inHouse.checkInDate,
        checkOutDate: inHouse.checkOutDate,
        roomNumber: inHouse.roomNumber,
      },
    };
  }

  const upcoming = own.filter((reservation) => isUpcoming(reservation, businessDate)).sort(compareUpcoming);
  const next = upcoming[0];
  if (next) {
    return {
      ...guest,
      rank: 1,
      roomNumber: next.roomNumber,
      sortDate: dateOnly(next.checkInDate),
      stay: null,
    };
  }

  const recency = own.reduce(
    (latest, reservation) => {
      const value = historyRecency(reservation);
      return value > latest ? value : latest;
    },
    ""
  );
  return {
    ...guest,
    rank: 2,
    roomNumber: "",
    sortDate: recency,
    stay: null,
  };
}

export function compareGuestListOrder(
  a: ClassifiedGuestListKey,
  b: ClassifiedGuestListKey
): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  if (a.rank === 0) {
    return (
      compareText(a.roomNumber, b.roomNumber) ||
      compareText(a.fullName, b.fullName) ||
      a.id.localeCompare(b.id)
    );
  }
  if (a.rank === 1) {
    return (
      a.sortDate.localeCompare(b.sortDate) ||
      compareText(a.fullName, b.fullName) ||
      a.id.localeCompare(b.id)
    );
  }
  return (
    b.sortDate.localeCompare(a.sortDate) ||
    compareText(a.fullName, b.fullName) ||
    a.id.localeCompare(b.id)
  );
}

export function sortGuestListRows(
  guests: readonly GuestListKey[],
  reservations: readonly GuestListReservation[],
  businessDate: string
): ClassifiedGuestListKey[] {
  const byGuest = new Map<string, GuestListReservation[]>();
  for (const reservation of reservations) {
    const rows = byGuest.get(reservation.guestId);
    if (rows) rows.push(reservation);
    else byGuest.set(reservation.guestId, [reservation]);
  }
  return guests
    .map((guest) => classifyGuest(guest, byGuest.get(guest.id) ?? [], businessDate))
    .sort(compareGuestListOrder);
}
