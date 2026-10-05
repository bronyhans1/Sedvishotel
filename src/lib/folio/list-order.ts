import { calculateFolioBalance } from "@/lib/folio/balance";
import { resolveEffectiveCheckOutDate } from "@/lib/reservations/effective-checkout-date";
import type { FolioDebitCredit, FolioBalanceFilter, FolioListItem, FolioStatusFilter } from "@/types/folio";

export type FolioListFilters = {
  search: string;
  status: FolioStatusFilter;
  balance: FolioBalanceFilter;
};

/** Header fields the folio list can filter and sort without loading entries. */
export type FolioListKey = {
  id: string;
  folioNumber: string;
  status: FolioListItem["status"];
  guestName: string | null;
  reservationNumber: string | null;
  folioRoomNumber: string | null;
  reservationRoomNumber: string | null;
  reservationStatus: string | null;
  checkInDate: string | null;
  scheduledCheckOutDate: string | null;
  actualCheckOutDate: string | null;
  openedAt: string;
  closedAt: string | null;
  hasReservation: boolean;
};

/** The fields calculateFolioBalance reads, plus a stable order. */
export type FolioSettlementLine = {
  id: string;
  folioId: string;
  debitCredit: FolioDebitCredit;
  total: number;
  createdAt: string;
};

export type FolioOperationalRow = FolioListItem & {
  reservationStatus: string | null;
  closedAt: string | null;
  departureDate: string;
};

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function dateOnly(value: string | null | undefined): string {
  return (value ?? "").slice(0, 10);
}

export function folioListRoomNumber(key: Pick<FolioListKey, "folioRoomNumber" | "reservationRoomNumber">): string {
  return key.folioRoomNumber ?? key.reservationRoomNumber ?? "—";
}

export function folioListGuestName(key: Pick<FolioListKey, "guestName">): string {
  return key.guestName ?? "—";
}

export function folioListReservationNumber(key: Pick<FolioListKey, "reservationNumber">): string {
  return key.reservationNumber ?? "—";
}

/**
 * Same predicate the folio screen used in the browser.
 * Name, room, reservation number, and folio number are case-insensitive.
 * Outstanding means a strictly positive authoritative balance. Zero and
 * credit balances stay in Paid.
 */
export function folioMatchesListFilters(
  item: Pick<
    FolioListItem,
    "status" | "outstandingBalance" | "guestName" | "roomNumber" | "reservationNumber" | "folioNumber"
  >,
  params: FolioListFilters
): boolean {
  if (params.status !== "all" && item.status !== params.status) return false;
  if (params.balance === "outstanding" && item.outstandingBalance <= 0) return false;
  if (params.balance === "paid" && item.outstandingBalance > 0) return false;
  const search = params.search.trim().toLowerCase();
  if (!search) return true;
  return (
    item.guestName.toLowerCase().includes(search) ||
    item.roomNumber.toLowerCase().includes(search) ||
    item.reservationNumber.toLowerCase().includes(search) ||
    item.folioNumber.toLowerCase().includes(search)
  );
}

/**
 * Authoritative list balance. Uses calculateFolioBalance on every settlement
 * line for the folio, ordered so the running round is deterministic.
 */
export function folioOutstandingBalance(lines: readonly FolioSettlementLine[]): number {
  const ordered = [...lines].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  );
  return calculateFolioBalance(
    ordered.map((line) => ({
      entryType: "adjustment" as const,
      debitCredit: line.debitCredit,
      total: line.total,
      vatAmount: 0,
    }))
  );
}

export function toFolioOperationalRow(
  key: FolioListKey,
  lines: readonly FolioSettlementLine[]
): FolioOperationalRow {
  const reservationStatus = key.reservationStatus;
  return {
    id: key.id,
    folioNumber: key.folioNumber,
    status: key.status,
    guestName: folioListGuestName(key),
    reservationNumber: folioListReservationNumber(key),
    roomNumber: folioListRoomNumber(key),
    checkInDate: key.checkInDate ?? "—",
    checkOutDate: key.hasReservation
      ? resolveEffectiveCheckOutDate({
          status: reservationStatus ?? "",
          check_out_date: key.scheduledCheckOutDate ?? "",
          actual_check_out_date: key.actualCheckOutDate,
        })
      : "—",
    outstandingBalance: folioOutstandingBalance(lines),
    openedAt: key.openedAt,
    reservationStatus,
    closedAt: key.closedAt,
    departureDate: dateOnly(key.actualCheckOutDate) || dateOnly(key.scheduledCheckOutDate),
  };
}

/**
 * List-only rank. Checked-in stays outrank a passed departure date.
 * Balance groups use the authoritative outstanding balance.
 */
export function folioListRank(row: Pick<FolioOperationalRow, "reservationStatus" | "outstandingBalance" | "status">): 0 | 1 | 2 | 3 {
  if (row.reservationStatus === "checked_in") return 0;
  if (row.outstandingBalance > 0) return 1;
  if (
    row.status === "closed" ||
    row.reservationStatus === "checked_out" ||
    row.reservationStatus === "checked_out_early"
  ) {
    return 2;
  }
  return 3;
}

export function compareFolioListOrder(a: FolioOperationalRow, b: FolioOperationalRow): number {
  const byRank = folioListRank(a) - folioListRank(b);
  if (byRank !== 0) return byRank;
  const rank = folioListRank(a);
  if (rank === 0) {
    return (
      compareText(a.roomNumber, b.roomNumber) ||
      compareText(a.guestName, b.guestName) ||
      compareText(a.folioNumber, b.folioNumber) ||
      a.id.localeCompare(b.id)
    );
  }
  if (rank === 1) {
    return (
      b.departureDate.localeCompare(a.departureDate) ||
      b.openedAt.localeCompare(a.openedAt) ||
      compareText(a.folioNumber, b.folioNumber) ||
      a.id.localeCompare(b.id)
    );
  }
  const aRecent = a.closedAt || a.openedAt;
  const bRecent = b.closedAt || b.openedAt;
  return (
    bRecent.localeCompare(aRecent) ||
    compareText(a.folioNumber, b.folioNumber) ||
    a.id.localeCompare(b.id)
  );
}

export function prepareFolioList(
  keys: readonly FolioListKey[],
  linesByFolioId: ReadonlyMap<string, readonly FolioSettlementLine[]>,
  filters: FolioListFilters
): FolioOperationalRow[] {
  const rows = keys
    .map((key) => toFolioOperationalRow(key, linesByFolioId.get(key.id) ?? []))
    .filter((row) => folioMatchesListFilters(row, filters));
  return rows.sort(compareFolioListOrder);
}
