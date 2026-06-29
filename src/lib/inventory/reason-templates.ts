export const STOCK_REASON_TEMPLATES = [
  "Purchase",
  "Damage",
  "Expired",
  "Returned",
  "Promotion",
  "Complimentary",
  "Physical Count",
  "Correction",
  "Other",
] as const;

export type StockReasonTemplate = (typeof STOCK_REASON_TEMPLATES)[number];

export function isOtherReasonTemplate(reason: string): boolean {
  return reason.trim().toLowerCase() === "other";
}

export function validateStockReason(reason: string, notes: string): string | null {
  if (!reason.trim()) {
    return "Select a reason for this stock movement.";
  }
  if (isOtherReasonTemplate(reason) && !notes.trim()) {
    return "Notes are required when reason is Other.";
  }
  return null;
}

export {
  MOVEMENT_SOURCE_LABELS,
  resolveMovementSource,
} from "@/lib/inventory/movement-source";
