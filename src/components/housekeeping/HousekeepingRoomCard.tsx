"use client";

import { cn } from "@/lib/utils";
import type { HousekeepingTask } from "@/types/housekeeping";

type Props = {
  task: HousekeepingTask;
  onClick: () => void;
};

const columnAccent: Record<HousekeepingTask["status"], string> = {
  pending_cleaning: "border-t-amber-500",
  cleaning: "border-t-blue-500",
  ready: "border-t-emerald-500",
  maintenance: "border-t-slate-500",
};

export function HousekeepingRoomCard({ task, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md border-t-4",
        columnAccent[task.status]
      )}
    >
      <p className="font-mono text-lg font-bold">{task.roomNumber}</p>
      <p className="text-xs text-muted-foreground">{task.roomTypeName}</p>
      <p className="mt-1 text-xs">{task.floorLabel}</p>
      <p className="mt-2 text-xs font-medium truncate">{task.assignedStaff}</p>
      {task.lastCheckoutTime !== "—" && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Out: {task.lastCheckoutTime}
        </p>
      )}
    </button>
  );
}
