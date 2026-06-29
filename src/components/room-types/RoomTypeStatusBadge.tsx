import { cn } from "@/lib/utils";
import type { RoomTypeStatus } from "@/types/room-type";

const labels: Record<RoomTypeStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

type RoomTypeStatusBadgeProps = {
  status: RoomTypeStatus;
  className?: string;
};

export function RoomTypeStatusBadge({
  status,
  className,
}: RoomTypeStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        status === "active"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "bg-slate-100 text-slate-600 ring-slate-500/25 dark:bg-slate-500/15 dark:text-slate-400",
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
