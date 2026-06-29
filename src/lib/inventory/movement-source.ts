export const MOVEMENT_SOURCE_LABELS: Record<string, string> = {
  pos: "POS",
  pos_sale: "POS",
  guest_folio: "Guest Folio",
  room_charge: "Guest Folio",
  manual: "Manual",
  adjustment: "Adjustment",
  supplier: "Supplier",
  restaurant: "Restaurant",
  laundry: "Laundry",
  inventory: "Manual",
};

export function resolveMovementSource(
  referenceType: string | null,
  movementType?: string
): string {
  if (referenceType) {
    const key = referenceType.toLowerCase();
    if (MOVEMENT_SOURCE_LABELS[key]) return MOVEMENT_SOURCE_LABELS[key];
  }
  if (movementType === "pos_sale") return "POS";
  if (movementType === "room_charge") return "Guest Folio";
  if (
    movementType &&
    ["stock_in", "stock_out", "opening_balance", "adjustment"].includes(
      movementType
    )
  ) {
    return "Manual";
  }
  return referenceType ? referenceType.replace(/_/g, " ") : "Manual";
}
