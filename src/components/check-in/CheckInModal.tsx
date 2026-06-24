"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { completeCheckInAction } from "@/features/check-in/actions";
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
import type { Reservation } from "@/types/reservation";

type Props = {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CheckInModal({
  reservation,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [idVerified, setIdVerified] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClose(next: boolean) {
    if (!next) {
      setIdVerified(false);
      setPaymentVerified(false);
      setRoomReady(false);
      setError("");
    }
    onOpenChange(next);
  }

  function handleCheckIn() {
    if (!reservation) return;
    setError("");
    startTransition(async () => {
      const result = await completeCheckInAction(reservation.id);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate(
        "Check-In Complete",
        `${reservation.guestName} checked in to Room ${reservation.roomNumber}.`
      );
      refresh();
      onSuccess?.();
    });
  }

  if (!reservation) return null;

  const canCheckIn = idVerified && paymentVerified && roomReady;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Guest Check-In</DialogTitle>
          <DialogDescription>
            {reservation.reservationNumber} · Room {reservation.roomNumber}
          </DialogDescription>
        </DialogHeader>

        <>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="space-y-4 rounded-lg border p-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Guest</p>
                <p className="font-semibold">{reservation.guestName}</p>
                <p>{reservation.guestPhone}</p>
                <p className="text-muted-foreground">{reservation.guestEmail}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Reservation</p>
                <p>{reservation.reservationNumber}</p>
                <ReservationStatusBadge status={reservation.status} />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Room</p>
                <p>
                  {reservation.roomNumber} · {reservation.roomTypeName}
                </p>
                <p className="text-muted-foreground">{reservation.floorLabel}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Verification Checklist</p>
              {[
                { id: "id", label: "ID Verified", checked: idVerified, set: setIdVerified },
                {
                  id: "pay",
                  label: "Payment Verified",
                  checked: paymentVerified,
                  set: setPaymentVerified,
                },
                { id: "room", label: "Room Ready", checked: roomReady, set: setRoomReady },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.set(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </label>
              ))}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/reservations/${reservation.id}`}>
                  View Reservation
                </Link>
              </Button>
              <Button
                onClick={handleCheckIn}
                disabled={!canCheckIn || isPending}
              >
                {isPending ? "Processing…" : "Complete Check-In"}
              </Button>
            </DialogFooter>
          </>
      </DialogContent>
    </Dialog>
  );
}
