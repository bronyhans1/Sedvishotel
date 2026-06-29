import { Badge } from "@/components/ui/badge";
import { STOCK_MOVEMENT_TYPE_OPTIONS } from "@/types/inventory";

export function formatMovementTypeLabel(type: string): string {
  return (
    STOCK_MOVEMENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ??
    type.replace(/_/g, " ")
  );
}

export function formatMovementQuantity(quantity: number): string {
  if (quantity > 0) return `+${quantity}`;
  return String(quantity);
}

export function LowStockBadge() {
  return (
    <Badge variant="outline" className="border-amber-500/50 text-amber-700">
      Low Stock
    </Badge>
  );
}
