import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { RoomStatus } from "@/types";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      status: {
        available:
          "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
        occupied:
          "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30",
        reserved:
          "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
        cleaning:
          "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/30",
        maintenance:
          "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30",
        operational:
          "bg-primary/10 text-primary ring-primary/20",
        live: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30",
      },
    },
    defaultVariants: {
      status: "operational",
    },
  }
);

const statusLabels: Record<RoomStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
};

type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  className?: string;
  label?: string;
};

export function StatusBadge({ status, className, label }: StatusBadgeProps) {
  const displayLabel =
    label ??
    (status && status in statusLabels
      ? statusLabels[status as RoomStatus]
      : "Operational");

  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {displayLabel}
    </span>
  );
}
