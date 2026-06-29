"use client";

import Link from "next/link";
import { Copy, ExternalLink, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  formatReservationSubmittedAt,
  resolveBookingSourceLabel,
  resolveReservationCreatedByLabel,
  resolveReservationStatusLabel,
} from "@/lib/reservations/booking-information";
import type { Reservation } from "@/types/reservation";

type BookingInformationCardProps = {
  reservation: Reservation;
  /** When false, hides the Open Reservation action (e.g. on the detail page). */
  showOpenReservation?: boolean;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function BookingInformationCard({
  reservation,
  showOpenReservation = false,
}: BookingInformationCardProps) {
  const toast = useToast();

  async function copyReservationNumber() {
    try {
      await navigator.clipboard.writeText(reservation.reservationNumber);
      toast.success("Reservation number copied");
    } catch {
      toast.error("Could not copy reservation number");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Booking Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DetailRow
          label="Booking Source"
          value={resolveBookingSourceLabel(reservation.bookingSource)}
        />
        <Separator />
        <DetailRow
          label="Submitted"
          value={formatReservationSubmittedAt(reservation.createdAt)}
        />
        <Separator />
        <DetailRow
          label="Reservation Status"
          value={resolveReservationStatusLabel(reservation.status)}
        />
        <Separator />
        <DetailRow
          label="Reservation Number"
          value={reservation.reservationNumber}
        />
        <Separator />
        <DetailRow
          label="Created By"
          value={resolveReservationCreatedByLabel(reservation)}
        />

        <Separator />

        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/guests/${reservation.guestId}`}>
              <User className="h-4 w-4" />
              Open Guest Profile
            </Link>
          </Button>
          {showOpenReservation ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/reservations/${reservation.id}`}>
                <ExternalLink className="h-4 w-4" />
                Open Reservation
              </Link>
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => void copyReservationNumber()}>
            <Copy className="h-4 w-4" />
            Copy Reservation Number
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
