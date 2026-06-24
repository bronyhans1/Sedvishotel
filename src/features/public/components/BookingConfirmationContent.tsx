"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hotelContact } from "@/config/hotel-contact";
import { BOOKING_STORAGE_KEY } from "@/lib/public-booking";
import { formatCurrency } from "@/lib/utils";
import type { BookingConfirmation } from "@/types/public";

export function BookingConfirmationContent() {
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
      if (raw) setBooking(JSON.parse(raw) as BookingConfirmation);
    } catch {
      setBooking(null);
    }
  }, []);

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold">No booking found</h1>
        <p className="mt-2 text-muted-foreground">
          Start a new reservation to receive a confirmation.
        </p>
        <Button asChild className="mt-6">
          <Link href="/book">Book a Room</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
        <h1 className="mt-6 font-serif text-3xl font-bold">Booking Confirmed</h1>
        <p className="mt-4 text-muted-foreground">
          Thank you, {booking.guestName}. Your reservation at SEDVIS HOTEL is confirmed.
          A confirmation email has been sent to {booking.email}.
        </p>
        <div className="mt-10 rounded-2xl border bg-card p-6 text-left text-sm shadow-sm">
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Reservation Number</dt>
              <dd className="font-mono font-semibold">{booking.reservationNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Guest</dt>
              <dd>{booking.guestName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Room</dt>
              <dd>{booking.roomName}</dd>
            </div>
            {booking.bedPreferenceLabel && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Bed Preference</dt>
                <dd>{booking.bedPreferenceLabel}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Check-in</dt>
              <dd>{booking.checkIn}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Check-out</dt>
              <dd>{booking.checkOut}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-bold">{formatCurrency(booking.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize text-emerald-600">{booking.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="capitalize">{booking.paymentStatus.replace("_", " ")}</dd>
            </div>
          </dl>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Questions about your stay? Call{" "}
          <a href={`tel:${hotelContact.phoneTel}`} className="font-medium text-brand-navy hover:text-brand-gold">
            {hotelContact.phoneDisplay}
          </a>
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/reservation-lookup">Lookup Reservation</Link>
          </Button>
          <Button asChild className="bg-brand-navy">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
