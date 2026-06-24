import { ClipboardList } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function HousekeepingEmptyState({ className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <ClipboardList className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">All rooms are in service</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        No rooms are currently in cleaning, ready, or maintenance queues.
      </p>
    </div>
  );
}
