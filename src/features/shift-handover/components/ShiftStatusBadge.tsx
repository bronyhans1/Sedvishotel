import { Badge } from "@/components/ui/badge";
import type { ShiftHandoverStatus } from "@/types/shift-handover";

export function ShiftStatusBadge({ status }: { status: ShiftHandoverStatus }) {
  const isOpen = status === "open";
  return (
    <Badge variant={isOpen ? "default" : "secondary"} className={isOpen ? "bg-blue-600" : ""}>
      {isOpen ? "Open" : "Closed"}
    </Badge>
  );
}
