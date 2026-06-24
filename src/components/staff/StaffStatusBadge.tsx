import { Badge } from "@/components/ui/badge";
import type { StaffStatus } from "@/types/staff";

const styles: Record<StaffStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  suspended: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const labels: Record<StaffStatus, string> = {
  active: "Active",
  suspended: "Suspended",
};

export function StaffStatusBadge({ status }: { status: StaffStatus }) {
  return (
    <Badge variant="secondary" className={styles[status]}>
      {labels[status]}
    </Badge>
  );
}
