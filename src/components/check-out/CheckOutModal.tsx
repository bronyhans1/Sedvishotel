"use client";

import { useState, useTransition } from "react";
import { FileText } from "lucide-react";

import { completeCheckOutAction } from "@/features/check-out/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { Reservation } from "@/types/reservation";

type Props = {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const ADDITIONAL_CHARGES = 0;

export function CheckOutModal({
  reservation,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClose(next: boolean) {
    if (!next) {
      setError("");
    }
    onOpenChange(next);
  }

  function handleCheckOut() {
    if (!reservation) return;
    setError("");
    startTransition(async () => {
      const result = await completeCheckOutAction(reservation.id);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate(
        "Check-Out Complete",
        `${reservation.guestName} checked out from Room ${reservation.roomNumber}.`
      );
      refresh();
      onSuccess?.();
    });
  }

  if (!reservation) return null;

  const totalWithExtras = reservation.totalAmount + ADDITIONAL_CHARGES;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Guest Check-Out</DialogTitle>
          <DialogDescription>
            Room {reservation.roomNumber} · {reservation.guestName}
          </DialogDescription>
        </DialogHeader>

        <>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="rounded-lg border p-4 text-sm space-y-2">
              <p className="font-semibold">{reservation.guestName}</p>
              <p className="text-muted-foreground">
                {reservation.checkInDate} — {reservation.checkOutDate} ·{" "}
                {reservation.numberOfNights} nights
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room charges</span>
                <span>{formatCurrency(reservation.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes</span>
                <span>{formatCurrency(reservation.taxes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Additional charges</span>
                <span>{formatCurrency(ADDITIONAL_CHARGES)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Amount</span>
                <span>{formatCurrency(totalWithExtras)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount paid</span>
                <span>{formatCurrency(reservation.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-medium text-amber-600">
                <span>Outstanding balance</span>
                <span>{formatCurrency(reservation.balance)}</span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" disabled>
                <FileText className="h-4 w-4" />
                Generate Invoice
              </Button>
              <Button onClick={handleCheckOut} disabled={isPending}>
                {isPending ? "Processing…" : "Complete Check-Out"}
              </Button>
            </DialogFooter>
          </>
      </DialogContent>
    </Dialog>
  );
}
