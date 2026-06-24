import { Badge } from "@/components/ui/badge";
import type { NightAuditStatus } from "@/types/night-audit";

type NightAuditStatusBadgeProps = {
  status: NightAuditStatus;
};

export function NightAuditStatusBadge({ status }: NightAuditStatusBadgeProps) {
  const isClosed = status === "closed";
  return (
    <Badge variant={isClosed ? "secondary" : "default"} className={isClosed ? "" : "bg-emerald-600"}>
      {isClosed ? "Closed" : "Open"}
    </Badge>
  );
}
