"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { completeShiftTaskAction } from "@/features/shift-handover/actions";
import { useToast } from "@/hooks/use-toast";
import { formatHandoverTimestamp } from "@/lib/shift-handover/format";
import type { ShiftHandoverAccess } from "@/lib/auth/shift-handover-access.types";
import type { ShiftHandoverTask } from "@/types/shift-handover";

type ShiftHandoverTasksListProps = {
  tasks: ShiftHandoverTask[];
  access: ShiftHandoverAccess;
  highlight?: boolean;
};

export function ShiftHandoverTasksList({
  tasks,
  access,
  highlight = false,
}: ShiftHandoverTasksListProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No pending tasks.</p>
    );
  }

  function completeTask(taskId: string) {
    startTransition(async () => {
      const result = await completeShiftTaskAction(taskId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Task marked as completed.");
      router.refresh();
    });
  }

  return (
    <ul className={`space-y-2 ${highlight ? "rounded-lg border border-amber-200/60 bg-amber-50/30 p-3 dark:border-amber-900/40 dark:bg-amber-950/20" : ""}`}>
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{task.description}</p>
            <p className="text-xs text-muted-foreground">
              Created {formatHandoverTimestamp(task.createdAt)}
              {task.createdByName ? ` by ${task.createdByName}` : ""}
            </p>
          </div>
          {access.canCloseShift ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => completeTask(task.id)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
