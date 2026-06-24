"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupReservation } from "@/lib/public-booking";
import type { ReservationLookupResult } from "@/types/public";

export function ReservationLookupContent() {
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<ReservationLookupResult | null | "not_found">(null);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const found = lookupReservation(number, email);
    setResult(found ?? "not_found");
  }

  return (
    <>
      <PublicPageHeader
        eyebrow="My Reservation"
        title="Reservation Lookup"
        subtitle="View your booking status with your confirmation number and email."
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
              <Label htmlFor="res-email">Email Address</Label>
              <Input
                id="res-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-brand-navy">
              <Search className="h-4 w-4" />
              Check Reservation
            </Button>
          </form>

          {result === "not_found" && (
            <p className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-center text-sm text-amber-800 dark:text-amber-200">
              No reservation found. Try SHMS-2026-0142 with kwame.mensah@email.com for a demo lookup.
            </p>
          )}

          {result && result !== "not_found" && (
            <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="font-serif text-lg font-semibold">Reservation Details</h2>
              <dl className="mt-4 space-y-3 text-sm">
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
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium text-emerald-600">{result.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Payment</dt>
                  <dd>{result.paymentStatus}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
