import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { ReservationStatus } from "@/types/reservation";

const variants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
  {
    variants: {
      status: {
        pending:
          "bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/15 dark:text-amber-400",
        confirmed:
          "bg-blue-50 text-blue-700 ring-blue-600/25 dark:bg-blue-500/15 dark:text-blue-400",
        checked_in:
          "bg-emerald-50 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-500/15 dark:text-emerald-400",
        checked_out:
          "bg-slate-100 text-slate-600 ring-slate-500/25 dark:bg-slate-500/15 dark:text-slate-400",
        checked_out_early:
          "bg-orange-50 text-orange-700 ring-orange-600/25 dark:bg-orange-500/15 dark:text-orange-400",
        cancelled:
          "bg-red-50 text-red-700 ring-red-600/25 dark:bg-red-500/15 dark:text-red-400",
        no_show:
          "bg-rose-50 text-rose-700 ring-rose-600/25 dark:bg-rose-500/15 dark:text-rose-400",
      },
    },
  }
);

const labels: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  checked_out_early: "Early Check-Out",
  cancelled: "Cancelled",
  no_show: "No Show",
};

type Props = { status: ReservationStatus; className?: string };

export function ReservationStatusBadge({ status, className }: Props) {
  return (
    <span className={cn(variants({ status }), className)}>
      {labels[status]}
    </span>
  );
}
