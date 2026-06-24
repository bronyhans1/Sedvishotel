"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, CalendarPlus, ArrowRightLeft } from "lucide-react";

import { EarlyCheckOutModal } from "@/components/check-out/EarlyCheckOutModal";
import { LateCheckOutModal } from "@/components/check-out/LateCheckOutModal";
import { ExtendStayModal } from "@/components/stays/ExtendStayModal";
import { MoveRoomModal } from "@/components/stays/MoveRoomModal";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getTodayDateString } from "@/lib/dates/today";
import { getCurrentTimeString } from "@/lib/dates/time";
import { canEarlyCheckOut } from "@/lib/reservations/early-checkout";
import { canLateCheckOut } from "@/lib/reservations/late-checkout";
import { canMoveRoom } from "@/lib/reservations/room-move";
import type { CheckOutAccess } from "@/lib/auth/check-out-access.types";
import type { CheckoutPolicy } from "@/types/late-checkout";
import type { ActiveStay } from "@/types/stay";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { GuestStatusBadge } from "@/components/guests/GuestStatusBadge";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";

type Props = {
  stay: ActiveStay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutAccess?: CheckOutAccess;
  checkoutPolicy?: CheckoutPolicy;
  onEarlyCheckOutSuccess?: () => void;
};

export function StayDetailsDrawer({
  stay,
  open,
  onOpenChange,
  checkoutAccess,
  checkoutPolicy,
  onEarlyCheckOutSuccess,
}: Props) {
  const [earlyCheckOutOpen, setEarlyCheckOutOpen] = useState(false);
  const [lateCheckOutOpen, setLateCheckOutOpen] = useState(false);
  const [extendStayOpen, setExtendStayOpen] = useState(false);
  const [moveRoomOpen, setMoveRoomOpen] = useState(false);

  if (!stay) return null;

  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();
  const showEarlyCheckOut =
    checkoutAccess?.canProcess &&
    canEarlyCheckOut(stay.status, stay.checkInDate, stay.expectedCheckOut, today);
  const showLateCheckOut =
    checkoutAccess?.canProcess &&
    checkoutPolicy &&
    canLateCheckOut(
      stay.status,
      stay.expectedCheckOut,
      today,
      currentTime,
      checkoutPolicy.checkOutTime
    );
  const showExtendStay =
    checkoutAccess?.canProcess &&
    canMoveRoom(stay.status);
  const showMoveRoom =
    checkoutAccess?.canProcess &&
    canMoveRoom(stay.status);

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Stay Details</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6 text-sm">
          <section>
            <h3 className="font-semibold mb-2">Guest Information</h3>
            <p className="font-medium">{stay.guestName}</p>
            <p className="text-muted-foreground">{stay.guestPhone}</p>
            <p className="text-muted-foreground">{stay.guestEmail}</p>
            {stay.guestId && (
              <Link
                href={`/dashboard/guests/${stay.guestId}`}
                className="mt-2 inline-block text-primary hover:underline"
              >
                View guest profile
              </Link>
            )}
          </section>
          <Separator />
          <section>
            <h3 className="font-semibold mb-2">Reservation</h3>
            <p className="font-mono text-xs">{stay.reservationNumber}</p>
            <div className="mt-2 flex gap-2">
              <ReservationStatusBadge status={stay.status} />
              <GuestStatusBadge status={stay.guestStatus} />
            </div>
            <Link
              href={`/dashboard/reservations/${stay.reservationId}`}
              className="mt-2 inline-block text-primary hover:underline"
            >
              View reservation
            </Link>
            {showEarlyCheckOut ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setEarlyCheckOutOpen(true)}
              >
                <LogOut className="h-4 w-4" />
                Early Check-Out
              </Button>
            ) : null}
            {showLateCheckOut ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setLateCheckOutOpen(true)}
              >
                <LogOut className="h-4 w-4" />
                Late Check-Out
              </Button>
            ) : null}
            {showExtendStay ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setExtendStayOpen(true)}
              >
                <CalendarPlus className="h-4 w-4" />
                Extend Stay
              </Button>
            ) : null}
            {showMoveRoom ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setMoveRoomOpen(true)}
              >
                <ArrowRightLeft className="h-4 w-4" />
                Move Room
              </Button>
            ) : null}
          </section>
          <Separator />
          <section>
            <h3 className="font-semibold mb-2">Stay Duration</h3>
            <p>
              {stay.checkInDate} → {stay.expectedCheckOut}
            </p>
            <p className="text-muted-foreground">{stay.nights} nights</p>
            <p className="mt-1">
              Room {stay.roomNumber} · {stay.roomTypeName}
            </p>
          </section>
          <Separator />
          <section>
            <h3 className="font-semibold mb-2">Outstanding Balance</h3>
            <p className="text-xl font-bold">{formatCurrency(stay.balance)}</p>
          </section>
          {stay.specialRequests.length > 0 && (
            <>
              <Separator />
              <section>
                <h3 className="font-semibold mb-2">Special Requests</h3>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {stay.specialRequests.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>

      {showEarlyCheckOut ? (
        <EarlyCheckOutModal
          reservationId={stay.reservationId}
          open={earlyCheckOutOpen}
          onOpenChange={setEarlyCheckOutOpen}
          onSuccess={() => {
            onEarlyCheckOutSuccess?.();
            onOpenChange(false);
          }}
        />
      ) : null}
      {showLateCheckOut ? (
        <LateCheckOutModal
          reservationId={stay.reservationId}
          open={lateCheckOutOpen}
          onOpenChange={setLateCheckOutOpen}
          onSuccess={() => {
            onEarlyCheckOutSuccess?.();
            onOpenChange(false);
          }}
        />
      ) : null}
      {showExtendStay ? (
        <ExtendStayModal
          reservationId={stay.reservationId}
          currentCheckOutDate={stay.expectedCheckOut}
          open={extendStayOpen}
          onOpenChange={setExtendStayOpen}
          onSuccess={() => {
            onEarlyCheckOutSuccess?.();
          }}
        />
      ) : null}
      {showMoveRoom ? (
        <MoveRoomModal
          reservationId={stay.reservationId}
          open={moveRoomOpen}
          onOpenChange={setMoveRoomOpen}
          onSuccess={() => {
            onEarlyCheckOutSuccess?.();
          }}
        />
      ) : null}
    </>
  );
}
