import { cn } from "@/lib/utils";
import type { GuestStatus } from "@/types/guest";

const styles: Record<GuestStatus, string> = {
  in_house:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-500/15 dark:text-emerald-400",
  reserved:
    "bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/15 dark:text-amber-400",
  checked_out:
    "bg-slate-100 text-slate-600 ring-slate-500/25 dark:bg-slate-500/15 dark:text-slate-400",
};

const labels: Record<GuestStatus, string> = {
  in_house: "In House",
  reserved: "Reserved",
  checked_out: "Checked Out",
};

export function GuestStatusBadge({
  status,
  className,
}: {
  status: GuestStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        styles[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
