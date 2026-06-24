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
import { formatCurrency } from "@/lib/utils";

type CloseNightAuditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedCash: number;
  loading?: boolean;
  onConfirm: (input: {
    cashCounted: number;
    notes?: string;
    varianceNotes?: string;
  }) => void;
};

export function CloseNightAuditDialog({
  open,
  onOpenChange,
  expectedCash,
  loading = false,
  onConfirm,
}: CloseNightAuditDialogProps) {
  const [cashCounted, setCashCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [varianceNotes, setVarianceNotes] = useState("");

  const countedValue = Number.parseFloat(cashCounted);
  const variance = useMemo(() => {
    if (!Number.isFinite(countedValue)) return null;
    return computeCashVariance(expectedCash, countedValue);
  }, [countedValue, expectedCash]);

  function handleConfirm() {
    if (!Number.isFinite(countedValue) || countedValue < 0) return;
    onConfirm({
      cashCounted: countedValue,
      notes: notes.trim() || undefined,
      varianceNotes: varianceNotes.trim() || undefined,
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setCashCounted("");
      setNotes("");
      setVarianceNotes("");
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Run Night Audit?</DialogTitle>
          <DialogDescription>
            Count physical cash, review variance, then close the business day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            disabled={loading || !Number.isFinite(countedValue) || countedValue < 0}
          >
            Run Night Audit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
