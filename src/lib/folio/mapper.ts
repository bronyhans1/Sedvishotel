import type {
  DbFolioEntry,
  DbGuestFolioWithRelations,
} from "@/types/database";
import {
  attachRunningBalances,
  buildFolioSummary,
  calculateFolioBalance,
} from "@/lib/folio/balance";
import { resolveEffectiveCheckOutDate } from "@/lib/reservations/effective-checkout-date";
import type { FolioEntry, FolioListItem, GuestFolio } from "@/types/folio";

export function mapDbFolioEntryToFolioEntry(
  row: DbFolioEntry & { creator?: { full_name: string | null } | null }
): FolioEntry {
  return {
    id: row.id,
    folioId: row.folio_id,
    entryType: row.entry_type,
    sourceModule: row.source_module,
    sourceReference: row.source_reference,
    description: row.description,
    quantity: Number(row.quantity),
    unitAmount: Number(row.unit_amount),
    subtotal: Number(row.subtotal),
    vatAmount: Number(row.vat_amount),
    total: Number(row.total),
    debitCredit: row.debit_credit,
    createdById: row.created_by,
    createdByName: row.creator?.full_name ?? null,
    createdAt: row.created_at,
  };
}

export function mapDbFolioToGuestFolio(row: DbGuestFolioWithRelations): GuestFolio {
  const entries = (row.entries ?? []).map(mapDbFolioEntryToFolioEntry);
  const summary = buildFolioSummary(entries);
  const reservation = row.reservation;

  return {
    id: row.id,
    reservationId: row.reservation_id,
    guestId: row.guest_id,
    roomId: row.room_id,
    folioNumber: row.folio_number,
    status: row.status,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    guestName: row.guest?.full_name ?? null,
    reservationNumber: reservation?.reservation_number ?? null,
    roomNumber: row.room?.room_number ?? reservation?.room?.room_number ?? null,
    checkInDate: reservation?.check_in_date ?? null,
    checkOutDate: reservation
      ? resolveEffectiveCheckOutDate({
          status: reservation.status,
          check_out_date: reservation.check_out_date,
          actual_check_out_date: reservation.actual_check_out_date,
        })
      : null,
    entries: attachRunningBalances(entries),
    outstandingBalance: calculateFolioBalance(entries),
    summary,
  };
}

export function mapDbFolioToListItem(row: DbGuestFolioWithRelations): FolioListItem {
  const entries = (row.entries ?? []).map(mapDbFolioEntryToFolioEntry);
  const reservation = row.reservation;

  return {
    id: row.id,
    folioNumber: row.folio_number,
    status: row.status,
    guestName: row.guest?.full_name ?? "—",
    reservationNumber: reservation?.reservation_number ?? "—",
    roomNumber: row.room?.room_number ?? reservation?.room?.room_number ?? "—",
    checkInDate: reservation?.check_in_date ?? "—",
    checkOutDate: reservation
      ? resolveEffectiveCheckOutDate({
          status: reservation.status,
          check_out_date: reservation.check_out_date,
          actual_check_out_date: reservation.actual_check_out_date,
        })
      : "—",
    outstandingBalance: calculateFolioBalance(entries),
    openedAt: row.opened_at,
  };
}
