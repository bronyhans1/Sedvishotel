"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { acknowledgeHandoverAction } from "@/features/shift-handover/actions";
import { useToast } from "@/hooks/use-toast";
import { formatHandoverTimestamp } from "@/lib/shift-handover/format";
import { formatShiftTypeLabel } from "@/lib/shift-handover/mapper";
import { formatCurrency } from "@/lib/utils";
import type {
  ShiftHandover,
  ShiftHandoverIssue,
  ShiftHandoverTask,
} from "@/types/shift-handover";

type HandoverReviewGateProps = {
  shift: ShiftHandover;
  pendingTasks: ShiftHandoverTask[];
  openIssues: ShiftHandoverIssue[];
};

export function HandoverReviewGate({
  shift,
  pendingTasks,
  openIssues,
}: HandoverReviewGateProps) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  function acknowledge() {
    startTransition(async () => {
      const result = await acknowledgeHandoverAction(shift.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Handover acknowledged. You may continue.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl [&>button]:hidden"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Incoming Shift Handover Review
          </DialogTitle>
          <DialogDescription>
            Review the previous shift handover before starting operational work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Previous Shift: </span>
              <span className="font-medium">
                {formatShiftTypeLabel(shift.shiftType)} ({shift.handoverNumber})
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Closed By: </span>
              <span className="font-medium">{shift.closedByName ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Closed Time: </span>
              <span className="font-medium">{formatHandoverTimestamp(shift.closedAt)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Cash Summary: </span>
              <span className="font-medium">
                {formatCurrency(shift.cashDrawerAmount)} →{" "}
                {shift.closingCash != null ? formatCurrency(shift.closingCash) : "—"}
                {shift.cashVariance != null ? (
                  <span className="text-muted-foreground">
                    {" "}
                    (variance {formatCurrency(shift.cashVariance)})
                  </span>
                ) : null}
              </span>
            </p>
          </div>

          {shift.closingNotes ? (
            <div className="rounded-lg border p-4">
              <p className="mb-1 font-medium">Closing Notes</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{shift.closingNotes}</p>
            </div>
          ) : null}

          {(pendingTasks.length > 0 || shift.pendingTasksSnapshot) && (
            <div className="rounded-lg border p-4">
              <p className="mb-2 font-medium">Pending Tasks</p>
              {pendingTasks.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {pendingTasks.map((task) => (
                    <li key={task.id}>{task.description}</li>
                  ))}
                </ul>
              ) : (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {shift.pendingTasksSnapshot}
                </p>
              )}
            </div>
          )}

          {(openIssues.length > 0 || shift.outstandingIssuesSnapshot) && (
            <div className="rounded-lg border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="mb-2 font-medium">Outstanding Issues</p>
              {openIssues.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {openIssues.map((issue) => (
                    <li key={issue.id}>{issue.description}</li>
                  ))}
                </ul>
              ) : (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {shift.outstandingIssuesSnapshot}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/shift-handover/${shift.handoverNumber}`}>
              View Full Details
            </Link>
          </Button>
          <Button onClick={acknowledge} disabled={isPending}>
            <CheckCircle2 className="h-4 w-4" />
            Acknowledge &amp; Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
