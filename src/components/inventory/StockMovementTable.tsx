import {
  formatMovementQuantity,
  formatMovementTypeLabel,
} from "@/components/inventory/stock-display";
import type {
  StockMovement,
  StockMovementSortDirection,
  StockMovementSortKey,
} from "@/types/inventory";

type StockMovementTableProps = {
  movements: StockMovement[];
  sortKey: StockMovementSortKey;
  sortDirection: StockMovementSortDirection;
  onSort: (key: StockMovementSortKey) => void;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StockMovementTable({
  movements,
  sortKey,
  sortDirection,
  onSort,
}: StockMovementTableProps) {
  void sortKey;
  void sortDirection;
  void onSort;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Movement Type</th>
              <th className="px-4 py-3 font-semibold">Quantity</th>
              <th className="px-4 py-3 font-semibold">Previous</th>
              <th className="px-4 py-3 font-semibold">New</th>
              <th className="px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Staff</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {movements.map((movement) => (
              <tr key={movement.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(movement.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{movement.productName}</p>
                  <p className="text-xs text-muted-foreground">{movement.productSku}</p>
                </td>
                <td className="px-4 py-3">
                  {formatMovementTypeLabel(movement.movementType)}
                </td>
                <td className="px-4 py-3 font-mono">
                  {formatMovementQuantity(movement.quantity)}
                </td>
                <td className="px-4 py-3">{movement.previousStock}</td>
                <td className="px-4 py-3 font-medium">{movement.newStock}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {movement.referenceType || movement.referenceId
                    ? [movement.referenceType, movement.referenceId]
                        .filter(Boolean)
                        .join(" · ")
                    : "—"}
                </td>
                <td className="px-4 py-3">{movement.movementSource}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {movement.performedByName ?? "—"}
                </td>
                <td className="max-w-[140px] truncate px-4 py-3 text-muted-foreground">
                  {movement.reason || "—"}
                </td>
                <td className="max-w-[140px] truncate px-4 py-3 text-muted-foreground">
                  {movement.notes || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
