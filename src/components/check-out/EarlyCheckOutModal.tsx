"use client";

import { useEffect, useState, useTransition } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeEarlyCheckOutAction,
  previewEarlyCheckOutAction,
} from "@/features/check-out/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { EARLY_CHECKOUT_REASONS, type EarlyCheckOutPreview } from "@/types/early-checkout";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type EarlyCheckOutModalProps = {
  reservationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function EarlyCheckOutModal({
  reservationId,
  open,
  onOpenChange,
  onSuccess,
}: EarlyCheckOutModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [preview, setPreview] = useState<EarlyCheckOutPreview | null>(null);
  const [reason, setReason] = useState<string>(EARLY_CHECKOUT_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loadingPreview, startPreviewTransition] = useTransition();

  useEffect(() => {
    if (!open || !reservationId) {
      setPreview(null);
      setError("");
      return;
    }

    startPreviewTransition(async () => {
      const data = await previewEarlyCheckOutAction(reservationId);
      setPreview(data);
      if (!data) {
        setError("Unable to load early check-out preview.");
      }
    });
  }, [open, reservationId]);

  function handleClose(next: boolean) {
    if (!next) {
      setNotes("");
      setReason(EARLY_CHECKOUT_REASONS[0]);
      setError("");
      setPreview(null);
    }
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!reservationId || !preview) return;
    setError("");
    startTransition(async () => {
      const result = await completeEarlyCheckOutAction(reservationId, {
        reason: reason as (typeof EARLY_CHECKOUT_REASONS)[number],
        notes: notes.trim() || undefined,
        actualCheckOutDate: preview.actualCheckOutDate,
      });
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate(
        "Early Check-Out Complete",
        `${preview.guestName} checked out early from Room ${preview.roomNumber}.`
      );
      refresh();
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Early Check-Out</DialogTitle>
          <DialogDescription>
            Process an early departure and refund unused nights.
          </DialogDescription>
        </DialogHeader>

        {loadingPreview ? (
          <p className="text-sm text-muted-foreground">Loading preview…</p>
        ) : preview ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Guest</p>
                <p className="font-medium">{preview.guestName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Room</p>
                <p className="font-medium">{preview.roomNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Original Stay</p>
                <p className="font-medium">
                  {preview.originalNights} nights · until {preview.originalCheckOutDate}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Actual Stay</p>
                <p className="font-medium">
                  {preview.actualNights} nights · leaving {preview.actualCheckOutDate}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Unused Nights</p>
                <p className="font-medium">{preview.unusedNights}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Refund Amount</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {formatCurrency(preview.refundAmount)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={selectClass}
              >
                {EARLY_CHECKOUT_REASONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes about the early departure…"
              />
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending || !preview || loadingPreview}>
            <LogOut className="h-4 w-4" />
            {isPending ? "Processing…" : "Confirm Early Check-Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
