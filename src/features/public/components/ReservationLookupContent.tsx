"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";

import { HotelContactAssistance } from "@/components/public/HotelContactAssistance";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { ReservationStatusTimeline } from "@/components/public/ReservationStatusTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupPublicReservationAction } from "@/features/public/actions";
import type { PublicHotelContactSettings, ReservationLookupResult } from "@/types/public";

type Props = {
  contactSettings: PublicHotelContactSettings;
};

export function ReservationLookupContent({ contactSettings }: Props) {
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<ReservationLookupResult | null | "not_found">(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    startTransition(async () => {
      const response = await lookupPublicReservationAction({
        reservationNumber: number,
        phone,
      });

      if (response.success) {
        setResult(response.result);
        return;
      }

      if (response.notFound) {
        setResult("not_found");
        return;
      }

      setError(response.error);
    });
  }

  return (
    <>
      <PublicPageHeader
        eyebrow="My Reservation"
        title="Reservation Lookup"
        subtitle="View your booking status with your confirmation number and phone number."
      />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          <form onSubmit={handleLookup} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="res-num">Reservation Number</Label>
              <Input
                id="res-num"
                placeholder="SHMS-2026-0142"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-phone">Phone Number</Label>
              <Input
                id="res-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-brand-navy" disabled={isPending}>
              <Search className="h-4 w-4" />
              {isPending ? "Checking…" : "Check Reservation"}
            </Button>
          </form>

          {error ? (
            <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {result === "not_found" && (
            <p className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-center text-sm text-amber-800 dark:text-amber-200">
              No reservation found. Please verify your reservation number and phone number.
            </p>
          )}

          {result && result !== "not_found" && (
            <div className="mt-8 space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="font-serif text-lg font-semibold">Reservation Details</h2>

              <ReservationStatusTimeline statusCode={result.statusCode} />

              <dl className="space-y-3 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Number</dt>
                  <dd className="font-mono font-medium">{result.reservationNumber}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Guest</dt>
                  <dd>{result.guestName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Room</dt>
                  <dd>{result.roomName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Check-in</dt>
                  <dd>{result.checkIn}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Check-out</dt>
                  <dd>{result.checkOut}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Payment</dt>
                  <dd>{result.paymentStatus}</dd>
                </div>
              </dl>
            </div>
          )}

          <HotelContactAssistance contact={contactSettings} />
        </div>
      </section>
    </>
  );
}
