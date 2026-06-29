"use client";

import { useState, useTransition } from "react";

import {
  markCleaningCompletedAction,
  markCleaningStartedAction,
  markMaintenanceAction,
  markRoomReadyAction,
} from "@/features/housekeeping/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { HousekeepingAccess } from "@/lib/auth/housekeeping-access.types";
import type { HousekeepingTask } from "@/types/housekeeping";

const STATUS_LABELS: Record<HousekeepingTask["status"], string> = {
  pending_cleaning: "Pending Cleaning",
  cleaning: "Cleaning",
  ready: "Ready",
  maintenance: "Maintenance",
};

type Props = {
  task: HousekeepingTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  access: HousekeepingAccess;
};

export function HousekeepingTaskPanel({
  task,
  open,
  onOpenChange,
  access,
}: Props) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!task) return null;

  function runAction(
    action: (roomId: string) => Promise<{ success: boolean; error?: string }>,
    headline: string,
    toastMessage?: string
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action(task!.roomId);
      if (result.success) {
        onOpenChange(false);
        toast.celebrate(headline, toastMessage ?? headline);
        refresh();
      } else {
        const message = result.error ?? "Action failed.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Room {task.roomNumber}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4 text-sm">
          <section>
            <h3 className="font-semibold mb-2">Room Information</h3>
            <p>{task.roomTypeName}</p>
            <p className="text-muted-foreground">{task.floorLabel}</p>
          </section>
          <Separator />
          <section>
            <h3 className="font-semibold mb-2">Cleaning Status</h3>
            <p className="font-medium">{STATUS_LABELS[task.status]}</p>
          </section>
          <Separator />
          <section>
            <p>
              <span className="text-muted-foreground">Assigned staff: </span>
              {task.assignedStaff}
            </p>
            <p className="mt-2">
              <span className="text-muted-foreground">Last guest: </span>
              {task.lastGuest}
            </p>
            <p className="mt-2">
              <span className="text-muted-foreground">Last checkout: </span>
              {task.lastCheckoutTime}
            </p>
            <p className="mt-2">
              <span className="text-muted-foreground">Expected completion: </span>
              {task.expectedCompletion}
            </p>
          </section>
          {task.notes && (
            <>
              <Separator />
              <section>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-muted-foreground">{task.notes}</p>
              </section>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {access.canManage && (
            <div className="space-y-2 pt-2">
              {task.status === "pending_cleaning" && (
                <Button
                  className="w-full"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      markCleaningStartedAction,
                      "Cleaning Started",
                      `Room ${task.roomNumber} cleaning started.`
                    )
                  }
                >
                  Mark Cleaning Started
                </Button>
              )}
              {task.status === "cleaning" && (
                <>
                  <Button
                    className="w-full"
                    disabled={isPending}
                    onClick={() =>
                      runAction(
                        markCleaningCompletedAction,
                        "Cleaning Complete",
                        `Room ${task.roomNumber} cleaning completed.`
                      )
                    }
                  >
                    Mark Cleaning Completed
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      runAction(
                        markRoomReadyAction,
                        "Room Ready",
                        `Room ${task.roomNumber} is ready.`
                      )
                    }
                  >
                    Mark Room Ready
                  </Button>
                </>
              )}
              {task.status === "ready" && (
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      markMaintenanceAction,
                      "Maintenance Set",
                      `Room ${task.roomNumber} marked for maintenance.`
                    )
                  }
                >
                  Mark Maintenance
                </Button>
              )}
              {task.status === "maintenance" && (
                <Button
                  className="w-full"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      markRoomReadyAction,
                      "Room Ready",
                      `Room ${task.roomNumber} is ready.`
                    )
                  }
                >
                  Mark Room Ready
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
