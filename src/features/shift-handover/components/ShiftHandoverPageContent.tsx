"use client";

import { useState, useTransition } from "react";
import { Clock, LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/PageContainer";
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
import { closeShiftAction, openShiftAction } from "@/features/shift-handover/actions";
import { ShiftHandoverHistoryTable } from "@/features/shift-handover/components/ShiftHandoverHistoryTable";
import { ShiftStatusBadge } from "@/features/shift-handover/components/ShiftStatusBadge";
import { useToast } from "@/hooks/use-toast";
import type { ShiftHandoverAccess } from "@/lib/auth/shift-handover-access.types";
import { formatHandoverTimestamp } from "@/lib/shift-handover/format";
import { formatShiftTypeLabel } from "@/lib/shift-handover/mapper";
import { siteConfig } from "@/config/site";
import { formatCurrency } from "@/lib/utils";
import type { ShiftHandover, ShiftType } from "@/types/shift-handover";

type ShiftHandoverPageContentProps = {
  currentShift: ShiftHandover | null;
  history: ShiftHandover[];
  access: ShiftHandoverAccess;
};

const SHIFT_TYPES: ShiftType[] = ["morning", "afternoon", "night"];

export function ShiftHandoverPageContent({
  currentShift,
  history,
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
  const [pendingTasks, setPendingTasks] = useState("");
  const [outstandingIssues, setOutstandingIssues] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [closeIssues, setCloseIssues] = useState("");

  function resetOpenForm() {
    setShiftType("morning");
    setCashDrawerAmount("");
    setNotes("");
    setPendingTasks("");
    setOutstandingIssues("");
  }

  function resetCloseForm() {
    setClosingCash("");
    setCloseNotes("");
    setCloseIssues(currentShift?.outstandingIssues ?? "");
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
        pendingTasks: pendingTasks.trim() || undefined,
        outstandingIssues: outstandingIssues.trim() || undefined,
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
        notes: closeNotes.trim() || undefined,
        outstandingIssues: closeIssues.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate("Shift Closed", "Shift handover completed.");
      resetCloseForm();
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
          <Button size="sm" disabled={isPending} onClick={() => { resetCloseForm(); setCloseDialog(true); }}>
            <LogOut className="h-4 w-4" />
            Close Shift
          </Button>
        ) : undefined
      }
    >
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
              <span className="text-muted-foreground">Cash Drawer Amount: </span>
              <span className="font-medium">{formatCurrency(currentShift.cashDrawerAmount)}</span>
            </p>
            {currentShift.pendingTasks ? (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Pending Tasks: </span>
                <span className="font-medium">{currentShift.pendingTasks}</span>
              </p>
            ) : null}
            {currentShift.outstandingIssues ? (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Outstanding Issues: </span>
                <span className="font-medium">{currentShift.outstandingIssues}</span>
              </p>
            ) : null}
            {currentShift.notes ? (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Notes: </span>
                <span className="font-medium">{currentShift.notes}</span>
              </p>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Handover History</h2>
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
              <Label htmlFor="cash-drawer">Cash Drawer Amount</Label>
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
              <Label htmlFor="open-notes">Notes</Label>
              <Textarea
                id="open-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pending-tasks">Pending Tasks</Label>
              <Textarea
                id="pending-tasks"
                value={pendingTasks}
                onChange={(e) => setPendingTasks(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="open-issues">Outstanding Issues</Label>
              <Textarea
                id="open-issues"
                value={outstandingIssues}
                onChange={(e) => setOutstandingIssues(e.target.value)}
                rows={2}
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
            <DialogDescription>Complete the current shift handover.</DialogDescription>
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
              <Label htmlFor="close-notes">Notes</Label>
              <Textarea
                id="close-notes"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="close-issues">Outstanding Issues</Label>
              <Textarea
                id="close-issues"
                value={closeIssues}
                onChange={(e) => setCloseIssues(e.target.value)}
                rows={2}
              />
            </div>
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
