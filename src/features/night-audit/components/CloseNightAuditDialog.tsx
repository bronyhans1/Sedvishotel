"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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
  cashVarianceClassName,
  computeCashVariance,
  formatSignedCurrency,
} from "@/lib/night-audit/cash-variance";
import type { NightAuditTimingAssessment } from "@/lib/night-audit/audit-window";
import { formatCurrency } from "@/lib/utils";
import type { OverstayNightAuditWarning } from "@/types/overstay";

type CloseNightAuditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedCash: number;
  auditDateLabel?: string;
  isReclose?: boolean;
  confirmLabel?: string;
  loading?: boolean;
  overstayWarning?: OverstayNightAuditWarning | null;
  timing?: NightAuditTimingAssessment | null;
  canManagerOverride?: boolean;
  onConfirm: (input: {
    cashCounted: number;
    notes?: string;
    varianceNotes?: string;
    overstayAcknowledged?: boolean;
    managerOverride?: boolean;
    overrideReason?: string;
    closeClassification?: NightAuditTimingAssessment["classification"];
    closeWallClock?: string;
    delayMinutes?: number;
  }) => void;
};

export function CloseNightAuditDialog({
  open,
  onOpenChange,
  expectedCash,
  auditDateLabel,
  isReclose = false,
  confirmLabel,
  loading = false,
  overstayWarning,
  timing = null,
  canManagerOverride = false,
  onConfirm,
}: CloseNightAuditDialogProps) {
  const [cashCounted, setCashCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [varianceNotes, setVarianceNotes] = useState("");
  const [overstayAck, setOverstayAck] = useState(false);
  const [managerOverride, setManagerOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const countedValue = Number.parseFloat(cashCounted);
  const variance = useMemo(() => {
    if (!Number.isFinite(countedValue)) return null;
    return computeCashVariance(expectedCash, countedValue);
  }, [countedValue, expectedCash]);

  const overstayTotal =
    (overstayWarning?.activeOverstayCount ?? 0) +
    (overstayWarning?.projectedOverstayCount ?? 0);
  const needsAck =
    overstayTotal > 0 && Boolean(overstayWarning?.requiresAcknowledgement);

  const needsReason = Boolean(timing?.requiresReason);
  const needsManager = Boolean(timing?.requiresManagerOverride);

  function handleConfirm() {
    if (!Number.isFinite(countedValue) || countedValue < 0) return;
    if (needsAck && !overstayAck) return;
    if (needsManager && (!managerOverride || !canManagerOverride)) return;
    if (needsReason && !overrideReason.trim()) return;
    onConfirm({
      cashCounted: countedValue,
      notes: notes.trim() || undefined,
      varianceNotes: varianceNotes.trim() || undefined,
      overstayAcknowledged: needsAck ? overstayAck : undefined,
      managerOverride: needsManager ? managerOverride : undefined,
      overrideReason: needsReason ? overrideReason.trim() : undefined,
      closeClassification: timing?.classification,
      closeWallClock: timing?.wallClock,
      delayMinutes: timing?.delayMinutes,
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setCashCounted("");
      setNotes("");
      setVarianceNotes("");
      setOverstayAck(false);
      setManagerOverride(false);
      setOverrideReason("");
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isReclose
              ? "Re-close Night Audit?"
              : "Close Current Business Day?"}
          </DialogTitle>
          <DialogDescription>
            {isReclose
              ? "Refresh the snapshot from live data, count physical cash, then re-close this business day."
              : "Count physical cash, review variance, then close the current business day and advance the operational date."}
            {auditDateLabel ? ` Date: ${auditDateLabel}.` : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {timing ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">
                Close classification: {timing.label}
              </p>
              <p className="mt-1 text-muted-foreground">{timing.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Wall clock {timing.wallClock}
                {timing.delayMinutes > 0
                  ? ` · Delay ${timing.delayMinutes} min past latest`
                  : ""}
              </p>
            </div>
          ) : null}

          {overstayTotal > 0 && overstayWarning ? (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
              <p className="font-medium">{overstayWarning.message}</p>
              {overstayWarning.requiresManager ? (
                <p className="mt-1 text-xs">
                  Hotel policy requires manager acknowledgement to continue.
                </p>
              ) : overstayWarning.requiresAcknowledgement ? (
                <p className="mt-1 text-xs">
                  Acknowledge overstays before closing (policy-driven).
                </p>
              ) : null}
              {needsAck ? (
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={overstayAck}
                    onChange={(e) => setOverstayAck(e.target.checked)}
                  />
                  <span>I acknowledge active Overstays and will continue.</span>
                </label>
              ) : null}
            </div>
          ) : null}

          {needsManager ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
              <p className="font-medium">Manager override required (Too Early)</p>
              {!canManagerOverride ? (
                <p className="mt-1 text-xs">
                  You need night_audit.manage to override earliest close.
                </p>
              ) : (
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={managerOverride}
                    onChange={(e) => setManagerOverride(e.target.checked)}
                  />
                  <span>I authorize early close with night_audit.manage.</span>
                </label>
              )}
            </div>
          ) : null}

          {needsReason ? (
            <div className="space-y-2">
              <Label htmlFor="override-reason">
                {needsManager ? "Override reason (required)" : "Close reason (required)"}
              </Label>
              <Textarea
                id="override-reason"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why Night Audit is closing at this time…"
                rows={2}
                required
              />
            </div>
          ) : null}

          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">Expected Cash</p>
            <p className="text-lg font-semibold">{formatCurrency(expectedCash)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cash-counted">Physical Cash Count</Label>
            <Input
              id="cash-counted"
              type="number"
              min="0"
              step="0.01"
              value={cashCounted}
              onChange={(e) => setCashCounted(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {variance != null ? (
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">Variance</p>
              <p className={`text-lg font-semibold ${cashVarianceClassName(variance)}`}>
                {formatSignedCurrency(variance)}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="variance-notes">Variance Notes</Label>
            <Textarea
              id="variance-notes"
              value={varianceNotes}
              onChange={(e) => setVarianceNotes(e.target.value)}
              placeholder="Optional notes about cash variance…"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="close-notes">Closing Notes</Label>
            <Textarea
              id="close-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional closing notes…"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              loading ||
              !Number.isFinite(countedValue) ||
              countedValue < 0 ||
              (needsAck && !overstayAck) ||
              (needsManager && (!managerOverride || !canManagerOverride)) ||
              (needsReason && !overrideReason.trim())
            }
          >
            {confirmLabel
              ? confirmLabel
              : isReclose
                ? "Re-close Night Audit"
                : "Close Current Business Day"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
