"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowRightLeft } from "lucide-react";

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
  completeRoomMoveAction,
  previewRoomMoveAction,
} from "@/features/stays/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHOD_OPTIONS, type TransactionPaymentMethod } from "@/types/payment";
import {
  ROOM_MOVE_REASONS,
  type RoomMovePreview,
} from "@/types/room-move";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type MoveRoomModalProps = {
  reservationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function MoveRoomModal({
  reservationId,
  open,
  onOpenChange,
  onSuccess,
}: MoveRoomModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [preview, setPreview] = useState<RoomMovePreview | null>(null);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [reason, setReason] = useState<string>(ROOM_MOVE_REASONS[0]);
  const [notes, setNotes] = useState("");
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
      const data = await previewRoomMoveAction(
        reservationId,
        newRoomNumber || undefined
      );
      setPreview(data);
      if (data) {
        if (!newRoomNumber && data.availableRooms[0]) {
          setNewRoomNumber(data.availableRooms[0].roomNumber);
        }
        setError("");
      } else {
        setError("Unable to load room move preview.");
      }
    });
  }, [open, reservationId, newRoomNumber]);

  function handleClose(next: boolean) {
    if (!next) {
      setNotes("");
      setNewRoomNumber("");
      setReason(ROOM_MOVE_REASONS[0]);
      setPaymentMethod("cash");
      setError("");
      setPreview(null);
    }
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!reservationId || !preview || !newRoomNumber) return;
    setError("");
    startTransition(async () => {
      const result = await completeRoomMoveAction(reservationId, {
        newRoomNumber,
        reason: reason as (typeof ROOM_MOVE_REASONS)[number],
        notes: notes.trim() || undefined,
        paymentMethod,
      });
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate(
        "Room Move Complete",
        `${preview.guestName} moved to Room ${newRoomNumber}.`
      );
      refresh();
      onSuccess?.();
    });
  }

  const needsPayment = (preview?.priceDifference ?? 0) > 0;
  const isRefund = (preview?.priceDifference ?? 0) < 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Move Room</DialogTitle>
          <DialogDescription>
            Move the guest to another room on the same reservation.
          </DialogDescription>
        </DialogHeader>

        {loadingPreview ? (
          <p className="text-sm text-muted-foreground">Loading preview…</p>
        ) : preview ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="font-semibold">Current Room</p>
              <p>
                {preview.currentRoomNumber} · {preview.currentRoomTypeName}
              </p>
              <p className="text-muted-foreground">{preview.currentFloorLabel}</p>
            </div>

            <div className="space-y-2">
              <Label>New Room</Label>
              <select
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                className={selectClass}
              >
                {preview.availableRooms.length === 0 ? (
                  <option value="">No available rooms</option>
                ) : (
                  preview.availableRooms.map((room) => (
                    <option key={room.roomNumber} value={room.roomNumber}>
                      {room.roomNumber} · {room.roomTypeName} · {room.floorLabel}
                    </option>
                  ))
                )}
              </select>
            </div>

            {newRoomNumber ? (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New room rate</span>
                  <span>{formatCurrency(preview.newNightlyRate)}/night</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Price difference</span>
                  <span
                    className={
                      preview.priceDifference > 0
                        ? "text-amber-600"
                        : preview.priceDifference < 0
                          ? "text-emerald-600"
                          : ""
                    }
                  >
                    {formatCurrency(preview.priceDifference)}
                    {isRefund ? " (refund)" : ""}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Reason</Label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={selectClass}
              >
                {ROOM_MOVE_REASONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {needsPayment ? (
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
                placeholder="Optional notes about the room move…"
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
              !newRoomNumber ||
              preview.availableRooms.length === 0 ||
              loadingPreview
            }
          >
            <ArrowRightLeft className="h-4 w-4" />
            {isPending ? "Processing…" : "Move Guest"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
