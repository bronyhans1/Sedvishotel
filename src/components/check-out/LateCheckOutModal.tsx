"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock } from "lucide-react";

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
  completeLateCheckOutAction,
  previewLateCheckOutAction,
} from "@/features/check-out/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHOD_OPTIONS, type TransactionPaymentMethod } from "@/types/payment";
import {
  LATE_CHECKOUT_REASONS,
  type LateCheckOutPreview,
} from "@/types/late-checkout";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type LateCheckOutModalProps = {
  reservationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function LateCheckOutModal({
  reservationId,
  open,
  onOpenChange,
  onSuccess,
}: LateCheckOutModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [preview, setPreview] = useState<LateCheckOutPreview | null>(null);
  const [reason, setReason] = useState<string>(LATE_CHECKOUT_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [actualTime, setActualTime] = useState("");
  const [complimentary, setComplimentary] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<TransactionPaymentMethod>("cash");
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
      const data = await previewLateCheckOutAction(
        reservationId,
        actualTime || undefined,
        complimentary
      );
      setPreview(data);
      if (data) {
        if (!actualTime) setActualTime(data.actualCheckoutTime);
      } else {
        setError("Unable to load late check-out preview.");
      }
    });
  }, [open, reservationId, actualTime, complimentary]);

  function handleClose(next: boolean) {
    if (!next) {
      setNotes("");
      setReason(LATE_CHECKOUT_REASONS[0]);
      setActualTime("");
      setComplimentary(false);
      setPaymentMethod("cash");
      setError("");
      setPreview(null);
    }
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!reservationId || !preview) return;
    setError("");
    startTransition(async () => {
      const result = await completeLateCheckOutAction(reservationId, {
        reason: reason as (typeof LATE_CHECKOUT_REASONS)[number],
        notes: notes.trim() || undefined,
        actualCheckoutTime: actualTime || preview.actualCheckoutTime,
        paymentMethod,
        complimentary,
      });
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate(
        "Late Check-Out Complete",
        `${preview.guestName} checked out late from Room ${preview.roomNumber}.`
      );
      refresh();
      onSuccess?.();
    });
  }

  const displayFee = preview?.complimentary ? 0 : preview?.lateCheckoutFee ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Late Check-Out</DialogTitle>
          <DialogDescription>
            {complimentary
              ? "Process a complimentary late departure and complete check-out."
              : "Charge a late departure fee and complete check-out."}
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
                <p className="text-muted-foreground">Checkout Time</p>
                <p className="font-medium">{preview.policyCheckOutTime}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Actual Checkout</p>
                <p className="font-medium">{actualTime || preview.actualCheckoutTime}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Hours Late</p>
                <p className="font-medium">{preview.hoursLate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Policy</p>
                <p className="font-medium">{preview.policyLabel}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Calculated Fee</p>
                <p className="text-lg font-semibold text-amber-600">
                  {formatCurrency(displayFee)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Actual Checkout Time</Label>
              <Input
                type="time"
                value={actualTime}
                onChange={(e) => setActualTime(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={complimentary}
                onChange={(e) => setComplimentary(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Complimentary Late Check-Out
            </label>

            <div className="space-y-2">
              <Label>Reason</Label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={selectClass}
              >
                {LATE_CHECKOUT_REASONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {!complimentary ? (
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as TransactionPaymentMethod)
                  }
                  className={selectClass}
                >
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes about the late departure…"
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
            <Clock className="h-4 w-4" />
            {isPending ? "Processing…" : "Confirm Late Check-Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
