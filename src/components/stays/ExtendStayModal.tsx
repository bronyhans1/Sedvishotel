"use client";

import { useEffect, useState, useTransition } from "react";
import { CalendarPlus } from "lucide-react";

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
  completeExtendStayAction,
  previewExtendStayAction,
} from "@/features/stays/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHOD_OPTIONS, type TransactionPaymentMethod } from "@/types/payment";
import type { ExtendStayPreview } from "@/types/extend-stay";

function nextDateString(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type ExtendStayModalProps = {
  reservationId: string | null;
  currentCheckOutDate?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ExtendStayModal({
  reservationId,
  currentCheckOutDate,
  open,
  onOpenChange,
  onSuccess,
}: ExtendStayModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [preview, setPreview] = useState<ExtendStayPreview | null>(null);
  const [newCheckOutDate, setNewCheckOutDate] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<TransactionPaymentMethod>("cash");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loadingPreview, startPreviewTransition] = useTransition();

  useEffect(() => {
    if (open && currentCheckOutDate) {
      setNewCheckOutDate(nextDateString(currentCheckOutDate));
    }
  }, [open, currentCheckOutDate]);

  useEffect(() => {
    if (!open || !reservationId || !newCheckOutDate) {
      if (!open) setPreview(null);
      return;
    }

    startPreviewTransition(async () => {
      const data = await previewExtendStayAction(reservationId, newCheckOutDate);
      setPreview(data);
      if (!data) {
        setError("Unable to preview stay extension. Check the new checkout date.");
      } else {
        setError("");
      }
    });
  }, [open, reservationId, newCheckOutDate]);

  function handleClose(next: boolean) {
    if (!next) {
      setNotes("");
      setNewCheckOutDate("");
      setPaymentMethod("cash");
      setError("");
      setPreview(null);
    }
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!reservationId || !preview || !newCheckOutDate) return;
    setError("");
    startTransition(async () => {
      const result = await completeExtendStayAction(reservationId, {
        newCheckOutDate,
        notes: notes.trim() || undefined,
        paymentMethod,
        recordPayment: preview.extraAmount > 0,
      });
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate(
        "Stay Extended",
        `${preview.guestName} extended until ${newCheckOutDate}.`
      );
      refresh();
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Extend Stay</DialogTitle>
          <DialogDescription>
            Extend the checkout date on the existing reservation.
          </DialogDescription>
        </DialogHeader>

        {loadingPreview && !preview ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {preview ? (
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
                <p className="text-muted-foreground">Current Checkout</p>
                <p className="font-medium">{preview.currentCheckOutDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Nights</p>
                <p className="font-medium">{preview.currentNights}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Total</p>
                <p className="font-medium">{formatCurrency(preview.currentTotal)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Checkout Date</Label>
              <Input
                type="date"
                value={newCheckOutDate}
                min={preview.currentCheckOutDate}
                onChange={(e) => setNewCheckOutDate(e.target.value)}
              />
            </div>

            {newCheckOutDate > preview.currentCheckOutDate ? (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Additional nights</span>
                  <span className="font-medium">{preview.extraNights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Additional amount</span>
                  <span className="font-semibold text-amber-600">
                    {formatCurrency(preview.extraAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New total</span>
                  <span className="font-medium">{formatCurrency(preview.newTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment required</span>
                  <span className="font-medium">
                    {formatCurrency(preview.paymentRequired)}
                  </span>
                </div>
              </div>
            ) : null}

            {preview.extraAmount > 0 ? (
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
                placeholder="Optional notes about the extension…"
              />
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              isPending ||
              !preview ||
              !newCheckOutDate ||
              newCheckOutDate <= (preview?.currentCheckOutDate ?? "") ||
              loadingPreview
            }
          >
            <CalendarPlus className="h-4 w-4" />
            {isPending ? "Processing…" : "Confirm Extension"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
