import { buildProgrammaticRefundIdempotencyKey } from "@/lib/payments/atomic-commit";
import type { DbGuestFolioWithRelations } from "@/types/database";
import type { DbPaymentTransaction } from "@/types/database";

export const EARLY_CHECKOUT_ADJUSTMENT_PREFIX = "Early check-out adjustment";

/** Stable folio source reference for idempotent early-checkout adjustment credits. */
export function buildEarlyCheckoutAdjustmentReference(reservationId: string): string {
  return `early_checkout_adjustment:${reservationId}`;
}

export type EarlyCheckoutProgress = {
  folioAdjustmentPosted: boolean;
  refundPosted: boolean;
  folioClosed: boolean;
  hasOpenFolio: boolean;
};

export function folioHasAccommodationLedger(
  folio: Pick<DbGuestFolioWithRelations, "entries"> | null | undefined
): boolean {
  if (!folio) return false;
  return (folio.entries ?? []).some((entry) => entry.entry_type === "accommodation");
}

export function folioHasEarlyCheckoutAdjustment(
  folio: Pick<DbGuestFolioWithRelations, "entries"> | null | undefined,
  adjustmentReference: string
): boolean {
  if (!folio) return false;
  return (folio.entries ?? []).some(
    (entry) =>
      entry.entry_type === "adjustment" &&
      entry.debit_credit === "credit" &&
      (entry.source_reference === adjustmentReference ||
        entry.description.startsWith(EARLY_CHECKOUT_ADJUSTMENT_PREFIX))
  );
}

export function reservationHasEarlyCheckoutAdjustment(
  folios: Array<Pick<DbGuestFolioWithRelations, "entries">>,
  adjustmentReference: string
): boolean {
  return folios.some((folio) => folioHasEarlyCheckoutAdjustment(folio, adjustmentReference));
}

export function paymentHasEarlyCheckoutRefund(
  transactions: Pick<DbPaymentTransaction, "idempotency_key" | "description">[],
  paymentId: string
): boolean {
  const expectedKey = buildProgrammaticRefundIdempotencyKey("early_checkout", paymentId);
  return transactions.some(
    (tx) =>
      tx.idempotency_key === expectedKey ||
      (tx.description?.includes("Early Check-Out") ?? false)
  );
}

export function resolveLedgerFolio(
  folios: DbGuestFolioWithRelations[]
): DbGuestFolioWithRelations | null {
  if (folios.length === 0) return null;

  const open = folios.find((folio) => folio.status === "open");
  if (open) return open;

  const withAccommodation = folios.filter(folioHasAccommodationLedger);
  if (withAccommodation.length > 0) {
    return withAccommodation.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }

  return folios.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

export function deriveEarlyCheckoutProgress(input: {
  folios: DbGuestFolioWithRelations[];
  adjustmentReference: string;
  paymentTransactions: Pick<DbPaymentTransaction, "idempotency_key" | "description">[];
  paymentId: string | null;
  expectRefund: boolean;
}): EarlyCheckoutProgress {
  const hasOpenFolio = input.folios.some((folio) => folio.status === "open");
  const folioAdjustmentPosted = reservationHasEarlyCheckoutAdjustment(
    input.folios,
    input.adjustmentReference
  );
  const refundPosted =
    input.expectRefund && input.paymentId
      ? paymentHasEarlyCheckoutRefund(input.paymentTransactions, input.paymentId)
      : false;
  const folioClosed = !hasOpenFolio && folioAdjustmentPosted;

  return {
    folioAdjustmentPosted,
    refundPosted,
    folioClosed,
    hasOpenFolio,
  };
}
