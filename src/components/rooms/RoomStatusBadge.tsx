import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { RoomStatus } from "@/types/room";

const roomStatusVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
  {
    variants: {
      status: {
        available:
          "bg-emerald-50 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/40",
        occupied:
          "bg-red-50 text-red-700 ring-red-600/25 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/40",
        reserved:
          "bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/40",
        cleaning:
          "bg-blue-50 text-blue-700 ring-blue-600/25 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/40",
        maintenance:
          "bg-slate-100 text-slate-600 ring-slate-500/25 dark:bg-slate-500/15 dark:text-slate-400 dark:ring-slate-500/40",
      },
    },
    defaultVariants: {
      status: "available",
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

export const roomStatusCardStyles: Record<RoomStatus, string> = {
  available:
    "border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-500/10 dark:border-emerald-500/30",
  occupied:
    "border-red-500/40 bg-red-50/80 dark:bg-red-500/10 dark:border-red-500/30",
  reserved:
    "border-amber-500/40 bg-amber-50/80 dark:bg-amber-500/10 dark:border-amber-500/30",
  cleaning:
    "border-blue-500/40 bg-blue-50/80 dark:bg-blue-500/10 dark:border-blue-500/30",
  maintenance:
    "border-slate-400/40 bg-slate-50/80 dark:bg-slate-500/10 dark:border-slate-500/30",
};

type RoomStatusBadgeProps = VariantProps<typeof roomStatusVariants> & {
  status: RoomStatus;
  className?: string;
};

export function RoomStatusBadge({ status, className }: RoomStatusBadgeProps) {
  return (
    <span className={cn(roomStatusVariants({ status }), className)}>
      {statusLabels[status]}
    </span>
  );
}
