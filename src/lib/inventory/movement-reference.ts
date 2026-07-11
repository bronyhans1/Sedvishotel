import { formatMovementTypeLabel } from "@/components/inventory/stock-display";
import type { StockMovement } from "@/types/inventory";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SALE_NUMBER_RE = /^SALE-\d{4}-\d{6}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isHumanReadable(value: string | null | undefined): value is string {
  if (!value?.trim()) return false;
  return !isUuid(value.trim());
}

function isSaleNumber(value: string): boolean {
  return SALE_NUMBER_RE.test(value.trim());
}

function extractSupplierReference(
  notes: string | null,
  referenceId: string | null
): string | null {
  for (const candidate of [notes, referenceId]) {
    if (!isHumanReadable(candidate)) continue;
    const trimmed = candidate.trim();
    const hashMatch = trimmed.match(/#\S+/);
    if (hashMatch) return hashMatch[0];
    if (/^\d{4}-\d{3,}$/.test(trimmed)) return `#${trimmed}`;
  }
  return null;
}

/**
 * Staff-facing stock movement reference — never exposes internal UUIDs.
 */
export function formatStockMovementReference(movement: StockMovement): string {
  const { movementType, referenceType, referenceId, notes } = movement;

  if (
    movementType === "pos_sale" ||
    movementType === "room_charge" ||
    referenceType?.toLowerCase() === "pos"
  ) {
    if (notes && isSaleNumber(notes)) return notes;
    if (referenceId && isSaleNumber(referenceId)) return referenceId;
    if (isHumanReadable(notes)) return notes.trim();
    return movementType === "room_charge" ? "Room Charge" : "POS Sale";
  }

  switch (movementType) {
    case "opening_balance":
      return "OPENING BALANCE";
    case "stock_in": {
      const supplierRef = extractSupplierReference(notes, referenceId);
      return supplierRef ? `STOCK IN ${supplierRef}` : "STOCK IN";
    }
    case "stock_out":
      return "STOCK OUT";
    case "adjustment":
      return "ADJUSTMENT";
    default: {
      if (isHumanReadable(referenceId)) return referenceId.trim();
      if (isHumanReadable(notes)) return notes.trim();
      return formatMovementTypeLabel(movementType).toUpperCase();
    }
  }
}
