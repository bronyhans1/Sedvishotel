"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRightLeft,
  BedDouble,
  Building2,
  Calendar,
  CalendarPlus,
  CircleDollarSign,
  LogOut,
  Mail,
  Pencil,
  Phone,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { EarlyCheckOutModal } from "@/components/check-out/EarlyCheckOutModal";
import { LateCheckOutModal } from "@/components/check-out/LateCheckOutModal";
import { ExtendStayModal } from "@/components/stays/ExtendStayModal";
import { MoveRoomModal } from "@/components/stays/MoveRoomModal";

import { EditReservationModal } from "@/components/reservations/EditReservationModal";
import { BookingInformationCard } from "@/components/reservations/BookingInformationCard";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { ReservationTimeline } from "@/components/reservations/ReservationTimeline";
import type { ReservationRoomTypeOption } from "@/features/reservations/load-reservations-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ReservationAccess } from "@/lib/auth/reservation-access.types";
import type { CheckOutAccess } from "@/lib/auth/check-out-access.types";
import { getTodayDateString } from "@/lib/dates/today";
import { getCurrentTimeString } from "@/lib/dates/time";
import { canEarlyCheckOut } from "@/lib/reservations/early-checkout";
import { canLateCheckOut, isLateCheckoutReservation } from "@/lib/reservations/late-checkout";
import { canMoveRoom } from "@/lib/reservations/room-move";
import { buildReservationTimeline } from "@/lib/reservations/mapper";
import { formatTaxSummaryLabel } from "@/lib/reservations/pricing";
import { formatCurrency, nightsBetween } from "@/lib/utils";
import { BOOKING_SOURCE_OPTIONS, type Reservation } from "@/types/reservation";
import type { CheckoutPolicy } from "@/types/late-checkout";

const sourceLabels = Object.fromEntries(
  BOOKING_SOURCE_OPTIONS.map((o) => [o.value, o.label])
);

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

type Props = {
  reservation: Reservation;
  access: ReservationAccess;
  checkoutAccess: CheckOutAccess;
  checkoutPolicy: CheckoutPolicy;
  roomTypeOptions: ReservationRoomTypeOption[];
};

function formatLateCheckoutTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ReservationDetailsContent({
  reservation,
  access,
  checkoutAccess,
  checkoutPolicy,
  roomTypeOptions,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [earlyCheckOutOpen, setEarlyCheckOutOpen] = useState(false);
  const [lateCheckOutOpen, setLateCheckOutOpen] = useState(false);
  const [extendStayOpen, setExtendStayOpen] = useState(false);
  const [moveRoomOpen, setMoveRoomOpen] = useState(false);
  const timeline = buildReservationTimeline(reservation);

  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();
  const showEarlyCheckOut =
    checkoutAccess.canProcess &&
    canEarlyCheckOut(
      reservation.status,
      reservation.checkInDate,
      reservation.checkOutDate,
      today
    );
  const showLateCheckOut =
    checkoutAccess.canProcess &&
    canLateCheckOut(
      reservation.status,
      reservation.checkOutDate,
      today,
      currentTime,
      checkoutPolicy.checkOutTime
    );
  const showStayOperations =
    checkoutAccess.canProcess && canMoveRoom(reservation.status);

  const isEarlyCheckout = reservation.status === "checked_out_early";
  const isLateCheckout = isLateCheckoutReservation(reservation.lateCheckOutAt);
  const originalStayNights =
    reservation.originalCheckOutDate != null
      ? nightsBetween(reservation.checkInDate, reservation.originalCheckOutDate)
      : reservation.numberOfNights;

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/dashboard/reservations">
              <ArrowLeft className="h-4 w-4" />
              Back to Reservations
            </Link>
          </Button>
          <h1 className="font-mono text-2xl font-bold tracking-tight md:text-3xl">
            {reservation.reservationNumber}
          </h1>
          <p className="text-muted-foreground">{reservation.guestName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ReservationStatusBadge status={reservation.status} />
          {showEarlyCheckOut ? (
            <Button size="sm" variant="outline" onClick={() => setEarlyCheckOutOpen(true)}>
              <LogOut className="h-4 w-4" />
              Early Check-Out
            </Button>
          ) : null}
          {showLateCheckOut ? (
            <Button size="sm" variant="outline" onClick={() => setLateCheckOutOpen(true)}>
              <LogOut className="h-4 w-4" />
              Late Check-Out
            </Button>
          ) : null}
          {showStayOperations ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setExtendStayOpen(true)}>
                <CalendarPlus className="h-4 w-4" />
                Extend Stay
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMoveRoomOpen(true)}>
                <ArrowRightLeft className="h-4 w-4" />
                Move Room
              </Button>
            </>
          ) : null}
          {access.canEdit && (
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {isEarlyCheckout ? (
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-lg">Early Check-Out</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Reason
              </p>
              <p className="mt-1 font-medium">
                {reservation.earlyCheckOutReason ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Refund Amount
              </p>
              <p className="mt-1 font-semibold text-emerald-600">
                {formatCurrency(reservation.earlyCheckOutRefundAmount ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actual Stay
              </p>
              <p className="mt-1 font-medium">
                {reservation.numberOfNights} nights · until{" "}
                {reservation.actualCheckOutDate ?? reservation.checkOutDate}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Original Stay
              </p>
              <p className="mt-1 font-medium">
                {originalStayNights} nights · until{" "}
                {reservation.originalCheckOutDate ?? reservation.checkOutDate}
              </p>
            </div>
            {reservation.earlyCheckOutNotes ? (
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <p className="mt-1 text-sm">{reservation.earlyCheckOutNotes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {isLateCheckout ? (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-lg">Late Check-Out</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Checkout Time
              </p>
              <p className="mt-1 font-medium">
                {formatLateCheckoutTime(reservation.lateCheckOutAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Fee
              </p>
              <p className="mt-1 font-semibold text-amber-600">
                {formatCurrency(reservation.lateCheckOutFee ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Type
              </p>
              <p className="mt-1 font-medium">
                {reservation.lateCheckOutComplimentary
                  ? "Complimentary"
                  : reservation.lateCheckOutPolicyType === "hour_based"
                    ? "Hour-Based"
                    : reservation.lateCheckOutPolicyType === "flat"
                      ? "Flat Fee"
                      : "Late Check-Out"}
              </p>
            </div>
            {reservation.lateCheckOutHoursLate != null ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Hours Late
                </p>
                <p className="mt-1 font-medium">{reservation.lateCheckOutHoursLate}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Reason
              </p>
              <p className="mt-1 font-medium">{reservation.lateCheckOutReason ?? "—"}</p>
            </div>
            {reservation.lateCheckOutNotes ? (
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <p className="mt-1 text-sm">{reservation.lateCheckOutNotes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {reservation.stayExtensionHistory.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Extension History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservation.stayExtensionHistory.map((entry, index) => (
              <div
                key={`${entry.extendedAt}-${index}`}
                className="rounded-lg border p-3 text-sm space-y-2"
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Original Checkout
                    </p>
                    <p className="mt-1 font-medium">{entry.fromCheckout}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Extended To
                    </p>
                    <p className="mt-1 font-medium">{entry.toCheckout}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Extra Nights
                    </p>
                    <p className="mt-1 font-medium">{entry.extraNights}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Extra Amount
                    </p>
                    <p className="mt-1 font-semibold text-amber-600">
                      {formatCurrency(entry.extraAmount)}
                    </p>
                  </div>
                </div>
                {entry.notes ? (
                  <p className="text-muted-foreground">{entry.notes}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {reservation.roomMoveHistory.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Room Move History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservation.roomMoveHistory.map((entry, index) => (
              <div
                key={`${entry.movedAt}-${index}`}
                className="rounded-lg border p-3 text-sm space-y-2"
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Move
                    </p>
                    <p className="mt-1 font-medium">
                      {entry.fromRoom} → {entry.toRoom}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Reason
                    </p>
                    <p className="mt-1 font-medium">{entry.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Date
                    </p>
                    <p className="mt-1 font-medium">
                      {new Date(entry.movedAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Price Difference
                    </p>
                    <p
                      className={`mt-1 font-semibold ${
                        entry.priceDifference > 0
                          ? "text-amber-600"
                          : entry.priceDifference < 0
                            ? "text-emerald-600"
                            : ""
                      }`}
                    >
                      {formatCurrency(entry.priceDifference)}
                    </p>
                  </div>
                </div>
                {entry.notes ? (
                  <p className="text-muted-foreground">{entry.notes}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <BookingInformationCard reservation={reservation} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Guest Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={User} label="Name" value={reservation.guestName} />
            <Separator />
            <InfoRow icon={Phone} label="Phone" value={reservation.guestPhone || "—"} />
            <Separator />
            <InfoRow icon={Mail} label="Email" value={reservation.guestEmail || "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reservation Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={Calendar}
              label="Reservation Number"
              value={reservation.reservationNumber}
            />
            <Separator />
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <div className="mt-1">
                  <ReservationStatusBadge status={reservation.status} />
                </div>
              </div>
            </div>
            <Separator />
            <InfoRow
              icon={Building2}
              label="Booking Source"
              value={
                sourceLabels[reservation.bookingSource] ??
                reservation.bookingSource
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Room Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={BedDouble}
              label="Room Number"
              value={reservation.roomNumber}
            />
            <Separator />
            <InfoRow
              icon={BedDouble}
              label="Room Type"
              value={reservation.roomTypeName}
            />
            <Separator />
            <InfoRow icon={Building2} label="Floor" value={reservation.floorLabel} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stay Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoRow
              icon={Calendar}
              label="Check-In"
              value={reservation.checkInDate}
            />
            <InfoRow
              icon={Calendar}
              label="Check-Out"
              value={reservation.checkOutDate}
            />
            <InfoRow
              icon={Users}
              label="Adults"
              value={String(reservation.adults)}
            />
            <InfoRow
              icon={Users}
              label="Children"
              value={String(reservation.children)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CircleDollarSign className="h-5 w-5 text-brand-gold" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Room Rate</span>
              <span className="font-medium">
                {formatCurrency(reservation.roomRate)}/night
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Number of Nights</span>
              <span className="font-medium">{reservation.numberOfNights}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(reservation.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formatTaxSummaryLabel(reservation.subtotal, reservation.taxes)}
              </span>
              <span>{formatCurrency(reservation.taxes)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Amount</span>
              <span>{formatCurrency(reservation.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatCurrency(reservation.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Balance</span>
              <span
                className={
                  reservation.balance > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                }
              >
                {formatCurrency(reservation.balance)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <ReservationTimeline events={timeline} />

      {access.canEdit && (
        <EditReservationModal
          reservation={reservation}
          open={editOpen}
          onOpenChange={setEditOpen}
          roomTypeOptions={roomTypeOptions}
          onSuccess={refresh}
        />
      )}

      {showEarlyCheckOut ? (
        <EarlyCheckOutModal
          reservationId={reservation.id}
          open={earlyCheckOutOpen}
          onOpenChange={setEarlyCheckOutOpen}
          onSuccess={refresh}
        />
      ) : null}

      {showLateCheckOut ? (
        <LateCheckOutModal
          reservationId={reservation.id}
          open={lateCheckOutOpen}
          onOpenChange={setLateCheckOutOpen}
          onSuccess={refresh}
        />
      ) : null}

      {showStayOperations ? (
        <>
          <ExtendStayModal
            reservationId={reservation.id}
            currentCheckOutDate={reservation.checkOutDate}
            open={extendStayOpen}
            onOpenChange={setExtendStayOpen}
            onSuccess={refresh}
          />
          <MoveRoomModal
            reservationId={reservation.id}
            open={moveRoomOpen}
            onOpenChange={setMoveRoomOpen}
            onSuccess={refresh}
          />
        </>
      ) : null}
    </div>
  );
}
