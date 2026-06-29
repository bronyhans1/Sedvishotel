"use client";

import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { useState } from "react";

import { PublicDateInput } from "@/components/public/PublicDateInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateMinimumStay } from "@/lib/public/booking-validation";
import type { PublicRoom } from "@/types/public";

type Props = {
  catalogRooms: PublicRoom[];
  defaultRoomSlug?: string;
  compact?: boolean;
};

export function BookingWidget({ catalogRooms, defaultRoomSlug, compact }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomType, setRoomType] = useState(defaultRoomSlug ?? "");
  const [requests, setRequests] = useState("");
  const [dateError, setDateError] = useState("");

  function handleCheckAvailability(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateMinimumStay(checkIn, checkOut);
    if (validationError) {
      setDateError(validationError);
      return;
    }
    setDateError("");

    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
    });
    if (roomType) params.set("room", roomType);
    if (requests) params.set("requests", requests);
    router.push(`/book?${params.toString()}`);
  }

  const selectClass =
    "flex h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

  const form = (
    <form onSubmit={handleCheckAvailability} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="bw-checkin">Check-In Date</Label>
          <PublicDateInput
            id="bw-checkin"
            value={checkIn}
            min={today}
            onChange={(e) => setCheckIn(e.target.value)}
            required
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="bw-checkout">Check-Out Date</Label>
          <PublicDateInput
            id="bw-checkout"
            value={checkOut}
            min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
            required
          />
        </div>
      </div>
      {dateError ? (
        <p className="text-sm text-destructive">{dateError}</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="bw-adults">Adults</Label>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="bw-adults"
              type="number"
              min={1}
              max={6}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="min-h-11 pl-10"
              required
            />
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="bw-children">Children</Label>
          <Input
            id="bw-children"
            type="number"
            min={0}
            max={4}
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className="min-h-11"
          />
        </div>
      </div>
      {!compact && (
        <>
          <div className="space-y-2">
            <Label htmlFor="bw-room">Accommodation</Label>
            <select
              id="bw-room"
              className={selectClass}
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
            >
              <option value="">Any available room</option>
              {catalogRooms.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bw-requests">Special Requests</Label>
            <Textarea
              id="bw-requests"
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              placeholder="Early check-in, dietary needs, celebration setup..."
              rows={3}
            />
          </div>
        </>
      )}
      <Button type="submit" className="w-full min-h-11 bg-brand-navy hover:bg-brand-navy/90" size="lg">
        Check Availability
      </Button>
    </form>
  );

  if (compact) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-lg">{form}</div>
    );
  }

  return form;
}
