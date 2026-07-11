"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { useTransition } from "react";

import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportShiftHandoverAction } from "@/features/shift-handover/actions";
import { ShiftHandoverIssuesList } from "@/features/shift-handover/components/ShiftHandoverIssuesList";
import { ShiftHandoverTasksList } from "@/features/shift-handover/components/ShiftHandoverTasksList";
import { ShiftStatusBadge } from "@/features/shift-handover/components/ShiftStatusBadge";
import { useToast } from "@/hooks/use-toast";
import type { ShiftHandoverAccess } from "@/lib/auth/shift-handover-access.types";
import { formatHandoverTimestamp } from "@/lib/shift-handover/format";
import { formatShiftTypeLabel } from "@/lib/shift-handover/mapper";
import { formatCurrency } from "@/lib/utils";
import type {
  ShiftHandover,
  ShiftHandoverIssue,
  ShiftHandoverTask,
} from "@/types/shift-handover";

type ShiftHandoverDetailContentProps = {
  shift: ShiftHandover;
  pendingTasks: ShiftHandoverTask[];
  openIssues: ShiftHandoverIssue[];
  access: ShiftHandoverAccess;
};

export function ShiftHandoverDetailContent({
  shift,
  pendingTasks,
  openIssues,
  access,
}: ShiftHandoverDetailContentProps) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function exportCsv() {
    startTransition(async () => {
      const result = await exportShiftHandoverAction(shift.handoverNumber, "CSV");
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([result.content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <PageContainer
      title={shift.handoverNumber}
      description={`${formatShiftTypeLabel(shift.shiftType)} shift handover details`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/shift-handover">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <CardTitle>Shift Summary</CardTitle>
          <ShiftStatusBadge status={shift.status} />
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Opened By: </span>
            <span className="font-medium">{shift.openedByName ?? "—"}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Opened At: </span>
            <span className="font-medium">{formatHandoverTimestamp(shift.openedAt)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Closed By: </span>
            <span className="font-medium">{shift.closedByName ?? "—"}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Closed At: </span>
            <span className="font-medium">{formatHandoverTimestamp(shift.closedAt)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Opening Cash: </span>
            <span className="font-medium">{formatCurrency(shift.cashDrawerAmount)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Closing Cash: </span>
            <span className="font-medium">
              {shift.closingCash != null ? formatCurrency(shift.closingCash) : "—"}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Variance: </span>
            <span className="font-medium">
              {shift.cashVariance != null ? formatCurrency(shift.cashVariance) : "—"}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Acknowledged: </span>
            <span className="font-medium">
              {shift.acknowledgedByName ?? "Pending"} —{" "}
              {formatHandoverTimestamp(shift.acknowledgedAt)}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Tasks Completed: </span>
            <span className="font-medium">{shift.tasksCompletedCount}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Issues Resolved: </span>
            <span className="font-medium">{shift.issuesResolvedCount}</span>
          </p>
          {shift.openingNotes ? (
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">Opening Notes: </span>
              <span className="font-medium">{shift.openingNotes}</span>
            </p>
          ) : null}
          {shift.closingNotes ? (
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">Closing Notes: </span>
              <span className="font-medium">{shift.closingNotes}</span>
            </p>
          ) : null}
          {shift.pendingTasksSnapshot ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">
              <span className="text-muted-foreground">Tasks Snapshot at Close: </span>
              <span className="font-medium">{shift.pendingTasksSnapshot}</span>
            </p>
          ) : null}
          {shift.outstandingIssuesSnapshot ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">
              <span className="text-muted-foreground">Issues Snapshot at Close: </span>
              <span className="font-medium">{shift.outstandingIssuesSnapshot}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ShiftHandoverTasksList tasks={pendingTasks} access={access} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Open Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <ShiftHandoverIssuesList issues={openIssues} access={access} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
