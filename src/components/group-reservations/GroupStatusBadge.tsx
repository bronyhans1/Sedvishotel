import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GroupReservationStatus } from "@/types/group-reservation";

const STATUS_CONFIG: Record<
  GroupReservationStatus,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  partially_checked_in: { label: "Partial Check-In", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  in_house: { label: "In House", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  partially_checked_out: { label: "Partial Check-Out", className: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
  completed: { label: "Completed", className: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  cancelled: { label: "Cancelled", className: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
};

type Props = { status: GroupReservationStatus; className?: string };

export function GroupStatusBadge({ status, className }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
