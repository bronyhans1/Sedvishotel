"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Clock,
  History,
  LogIn,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/PageContainer";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  acknowledgeHandoverAction,
  closeShiftAction,
  openShiftAction,
} from "@/features/shift-handover/actions";
import { ShiftHandoverHistoryTable } from "@/features/shift-handover/components/ShiftHandoverHistoryTable";
import { ShiftHandoverIssuesList } from "@/features/shift-handover/components/ShiftHandoverIssuesList";
import { ShiftHandoverTasksList } from "@/features/shift-handover/components/ShiftHandoverTasksList";
import { ShiftStatusBadge } from "@/features/shift-handover/components/ShiftStatusBadge";
import { useToast } from "@/hooks/use-toast";
import type { ShiftHandoverAccess } from "@/lib/auth/shift-handover-access.types";
import { formatHandoverTimestamp } from "@/lib/shift-handover/format";
import { formatShiftTypeLabel } from "@/lib/shift-handover/mapper";
import { siteConfig } from "@/config/site";
import { formatCurrency } from "@/lib/utils";
import type {
  ShiftHandover,
  ShiftHandoverIssue,
  ShiftHandoverTask,
  ShiftType,
} from "@/types/shift-handover";

type ShiftHandoverPageContentProps = {
  currentShift: ShiftHandover | null;
  history: ShiftHandover[];
  pendingTasks: ShiftHandoverTask[];
  openIssues: ShiftHandoverIssue[];
  recentlyClosed: ShiftHandover | null;
  pendingAcknowledgement: ShiftHandover | null;
  attentionCount: number;
  access: ShiftHandoverAccess;
};

const SHIFT_TYPES: ShiftType[] = ["morning", "afternoon", "night"];

export function ShiftHandoverPageContent({
  currentShift,
  history,
  pendingTasks,
  openIssues,
  recentlyClosed,
  pendingAcknowledgement,
  attentionCount,
  access,
}: ShiftHandoverPageContentProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [shiftType, setShiftType] = useState<ShiftType>("morning");
  const [cashDrawerAmount, setCashDrawerAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [pendingTasksText, setPendingTasksText] = useState("");
  const [outstandingIssuesText, setOutstandingIssuesText] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const needsAttention = attentionCount > 0;

  function resetOpenForm() {
    setShiftType("morning");
    setCashDrawerAmount("");
    setNotes("");
    setPendingTasksText("");
    setOutstandingIssuesText("");
  }

  function resetCloseForm() {
    setClosingCash("");
    setClosingNotes("");
  }

  function runOpenShift() {
    const amount = Number.parseFloat(cashDrawerAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Cash drawer amount is required.");
      return;
    }
    setOpenDialog(false);
    startTransition(async () => {
      const result = await openShiftAction({
        shiftType,
        cashDrawerAmount: amount,
        notes: notes.trim() || undefined,
        pendingTasks: pendingTasksText.trim() || undefined,
        outstandingIssues: outstandingIssuesText.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate("Shift Opened", `${formatShiftTypeLabel(shiftType)} shift is now open.`);
      resetOpenForm();
      router.refresh();
    });
  }

  function runCloseShift() {
    const amount = Number.parseFloat(closingCash);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Closing cash amount is required.");
      return;
    }
    setCloseDialog(false);
    startTransition(async () => {
      const result = await closeShiftAction({
        closingCash: amount,
        closingNotes: closingNotes.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate("Shift Closed", "Handover package saved for incoming staff.");
      resetCloseForm();
      router.refresh();
    });
  }

  function acknowledgePending() {
    if (!pendingAcknowledgement) return;
    startTransition(async () => {
      const result = await acknowledgeHandoverAction(pendingAcknowledgement.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Handover acknowledged.");
      router.refresh();
    });
  }

  return (
    <PageContainer
      title="Shift Handover"
      description={`Operational shift transitions for ${siteConfig.name}.`}
      actions={
        access.canOpenShift && !currentShift ? (
          <Button size="sm" disabled={isPending} onClick={() => setOpenDialog(true)}>
            <LogIn className="h-4 w-4" />
            Open Shift
          </Button>
        ) : access.canCloseShift && currentShift ? (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => {
              resetCloseForm();
              setCloseDialog(true);
            }}
          >
            <LogOut className="h-4 w-4" />
            Close Shift
          </Button>
        ) : undefined
      }
    >
      {needsAttention ? (
        <Card className="border-amber-200/70 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Needs Your Attention
              <StatusBadge status="reserved" label={String(attentionCount)} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {pendingAcknowledgement ? (
              <p>
                Unacknowledged handover from {pendingAcknowledgement.closedByName ?? "previous staff"} (
                {pendingAcknowledgement.handoverNumber}).
              </p>
            ) : null}
            {pendingTasks.length > 0 ? (
              <p>{pendingTasks.length} pending task(s) require action.</p>
            ) : null}
            {openIssues.length > 0 ? (
              <p>{openIssues.length} outstanding issue(s) remain open.</p>
            ) : null}
            {pendingAcknowledgement && access.canView ? (
              <Button size="sm" variant="outline" disabled={isPending} onClick={acknowledgePending}>
                Acknowledge Handover
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Shift
            </CardTitle>
            {currentShift ? (
              <>
                <p className="mt-1 font-mono text-sm">{currentShift.handoverNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {formatShiftTypeLabel(currentShift.shiftType)} shift
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No shift is currently open.</p>
            )}
          </div>
          <ShiftStatusBadge status={currentShift?.status ?? "closed"} />
        </CardHeader>
        {currentShift ? (
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Opened By: </span>
              <span className="font-medium">{currentShift.openedByName ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Opened At: </span>
              <span className="font-medium">{formatHandoverTimestamp(currentShift.openedAt)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Opening Cash: </span>
              <span className="font-medium">{formatCurrency(currentShift.cashDrawerAmount)}</span>
            </p>
            {currentShift.openingNotes ? (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Opening Notes: </span>
                <span className="font-medium">{currentShift.openingNotes}</span>
              </p>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ShiftHandoverTasksList
              tasks={pendingTasks}
              access={access}
              highlight={pendingTasks.length > 0}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outstanding Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <ShiftHandoverIssuesList
              issues={openIssues}
              access={access}
              highlight={openIssues.length > 0}
            />
          </CardContent>
        </Card>
      </div>

      {recentlyClosed ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="text-base">Recently Closed Shift</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/shift-handover/${recentlyClosed.handoverNumber}`}>
                View Details
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Shift: </span>
              <span className="font-medium">
                {formatShiftTypeLabel(recentlyClosed.shiftType)} ({recentlyClosed.handoverNumber})
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Closed By: </span>
              <span className="font-medium">{recentlyClosed.closedByName ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Closed At: </span>
              <span className="font-medium">
                {formatHandoverTimestamp(recentlyClosed.closedAt)}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Cash: </span>
              <span className="font-medium">
                {formatCurrency(recentlyClosed.cashDrawerAmount)} →{" "}
                {recentlyClosed.closingCash != null
                  ? formatCurrency(recentlyClosed.closingCash)
                  : "—"}
              </span>
            </p>
            {recentlyClosed.closingNotes ? (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Closing Notes: </span>
                <span className="font-medium">{recentlyClosed.closingNotes}</span>
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <History className="h-5 w-5" />
          Handover History
        </h2>
        <ShiftHandoverHistoryTable handovers={history} />
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Open Shift</DialogTitle>
            <DialogDescription>Start a new operational shift handover.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shift-type">Shift Type</Label>
              <select
                id="shift-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value as ShiftType)}
              >
                {SHIFT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatShiftTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cash-drawer">Opening Cash Amount</Label>
              <Input
                id="cash-drawer"
                type="number"
                min="0"
                step="0.01"
                value={cashDrawerAmount}
                onChange={(e) => setCashDrawerAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="open-notes">Opening Notes</Label>
              <Textarea
                id="open-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pending-tasks">New Pending Tasks (one per line)</Label>
              <Textarea
                id="pending-tasks"
                value={pendingTasksText}
                onChange={(e) => setPendingTasksText(e.target.value)}
                rows={2}
                placeholder="Follow up on room 204 minibar&#10;Prepare VIP arrival folder"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="open-issues">New Outstanding Issues (one per line)</Label>
              <Textarea
                id="open-issues"
                value={outstandingIssuesText}
                onChange={(e) => setOutstandingIssuesText(e.target.value)}
                rows={2}
                placeholder="Elevator maintenance pending&#10;POS terminal #2 intermittent"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={runOpenShift} disabled={isPending}>
              Open Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close Shift</DialogTitle>
            <DialogDescription>
              Complete the shift and save the handover package for incoming staff.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="closing-cash">Closing Cash</Label>
              <Input
                id="closing-cash"
                type="number"
                min="0"
                step="0.01"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="close-notes">Closing Notes</Label>
              <Textarea
                id="close-notes"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                rows={3}
                placeholder="Summary for the incoming shift..."
              />
            </div>
            {(pendingTasks.length > 0 || openIssues.length > 0) && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Handover package will include:</p>
                <p>{pendingTasks.length} pending task(s) and {openIssues.length} open issue(s).</p>
                <p className="mt-1 text-xs">Outstanding issues persist until explicitly resolved.</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCloseDialog(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={runCloseShift} disabled={isPending}>
              Close Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
