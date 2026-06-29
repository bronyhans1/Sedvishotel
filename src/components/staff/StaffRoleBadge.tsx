import { Badge } from "@/components/ui/badge";
import type { StaffRole } from "@/types/staff";

const labels: Record<StaffRole, string> = {
  admin: "Admin",
  manager: "Manager",
  receptionist: "Receptionist",
  housekeeping: "Housekeeping",
};

const styles: Record<StaffRole, string> = {
  admin: "bg-primary/15 text-primary",
  manager: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  receptionist: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  housekeeping: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
};

export function StaffRoleBadge({ role }: { role: StaffRole }) {
  return (
    <Badge variant="secondary" className={styles[role]}>
      {labels[role]}
    </Badge>
  );
}
