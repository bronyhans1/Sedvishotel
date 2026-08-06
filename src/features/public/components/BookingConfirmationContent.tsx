"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hotelContact } from "@/config/hotel-contact";
import { BOOKING_STORAGE_KEY } from "@/lib/public-booking";
import { formatCurrency } from "@/lib/utils";
import type { BookingConfirmation } from "@/types/public";

const WHATSAPP_HREF = `https://wa.me/${hotelContact.phoneTel.replace(/\D/g, "")}`;

export function BookingConfirmationContent() {
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
      if (raw) setBooking(JSON.parse(raw) as BookingConfirmation);
    } catch {
      setBooking(null);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        aria-busy="true"
        aria-label="Loading confirmation"
      >
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold">No booking found</h1>
        <p className="mt-2 text-muted-foreground">
          Start a new reservation to receive an acknowledgement.
        </p>
        <Button asChild className="mt-6">
          <Link href="/book">Book a Room</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-gold/10 via-background to-background"
        aria-hidden
      />
      <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-8 ring-emerald-500/10 animate-shms-success-in">
          <Check
            className="h-10 w-10 text-emerald-600"
            strokeWidth={2.5}
            aria-hidden
          />
        </div>
        <h1 className="mt-8 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
          Thank You!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your reservation request has been received.
        </p>

        <div className="mt-10 rounded-[1.75rem] border border-brand-gold/20 bg-card p-6 text-left shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] sm:p-8">
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-dashed pb-4">
              <dt className="text-muted-foreground">Reservation Reference</dt>
              <dd className="font-mono text-base font-semibold tracking-wide">
                {booking.reservationNumber}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Guest Name</dt>
              <dd className="font-medium">{booking.guestName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Room</dt>
              <dd className="font-medium">{booking.roomName}</dd>
            </div>
            {booking.bedPreferenceLabel ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Bed Preference</dt>
                <dd>{booking.bedPreferenceLabel}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Stay Dates</dt>
              <dd className="font-medium">
                {booking.checkIn} → {booking.checkOut}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Estimated Total</dt>
              <dd className="font-serif text-xl font-bold text-brand-navy">
                {formatCurrency(booking.total)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 rounded-xl bg-amber-500/10 px-3 py-3">
              <dt className="text-amber-900 dark:text-amber-100">Reservation Status</dt>
              <dd className="font-semibold text-amber-800 dark:text-amber-100">
                Pending Confirmation
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
          Our reservations team will contact you shortly to confirm your booking.
        </p>

        <div className="mt-6 rounded-2xl border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{hotelContact.name}</p>
          <p className="mt-1">{hotelContact.shortLocation}</p>
          <p className="mt-2">
            <a
              href={`tel:${hotelContact.phoneTel}`}
              className="font-medium text-brand-navy hover:text-brand-gold"
            >
              {hotelContact.phoneDisplay}
            </a>
            {" · "}
            <a
              href={`mailto:${hotelContact.reservationsEmail}`}
              className="font-medium text-brand-navy hover:text-brand-gold"
            >
              {hotelContact.reservationsEmail}
            </a>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <a href={`tel:${hotelContact.phoneTel}`}>
              <Phone className="h-4 w-4" />
              Call Reception
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              WhatsApp Hotel
            </a>
          </Button>
          <Button asChild className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90">
            <Link href="/book">Book Another Stay</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
