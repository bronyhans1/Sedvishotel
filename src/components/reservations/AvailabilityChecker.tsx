"use client";

import { useState, useTransition } from "react";
import { BedDouble, CalendarRange } from "lucide-react";
import Link from "next/link";

import { RoomStatusBadge } from "@/components/rooms/RoomStatusBadge";
import { checkAvailabilityAction } from "@/features/reservations/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import type { AvailableRoom } from "@/services/reservation.service";
import type { DbRoomStatus } from "@/types/database";

export function AvailabilityChecker() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [searched, setSearched] = useState(false);
  const [available, setAvailable] = useState<AvailableRoom[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const invalidRange = checkIn && checkOut && checkOut <= checkIn;

  function handleSearch() {
    setError("");
    setSearched(true);
    startTransition(async () => {
      const result = await checkAvailabilityAction(checkIn, checkOut);
      if (!result.success) {
        setError(result.error);
        setAvailable([]);
        return;
      }
      setAvailable(result.rooms);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarRange className="h-5 w-5 text-primary" />
          Availability Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="avail-in">Check-In Date</Label>
            <Input
              id="avail-in"
              type="date"
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setSearched(false);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avail-out">Check-Out Date</Label>
            <Input
              id="avail-out"
              type="date"
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setSearched(false);
              }}
            />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button
              className="w-full"
              onClick={handleSearch}
              disabled={!checkIn || !checkOut || !!invalidRange || isPending}
            >
              {isPending ? "Checking…" : "Check Availability"}
            </Button>
          </div>
        </div>

        {invalidRange && (
          <p className="text-sm text-destructive">
            Check-out must be after check-in.
          </p>
        )}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {searched && !invalidRange && !error && (
          <div>
            <p className="mb-3 text-sm font-medium">
              {available.length} room{available.length !== 1 ? "s" : ""}{" "}
              available
            </p>
            {available.length === 0 ? (
              <div className="flex flex-col items-center rounded-lg border border-dashed py-10 text-center">
                <BedDouble className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 font-medium">No available rooms</p>
                <p className="text-sm text-muted-foreground">
                  All rooms are booked or unavailable for these dates.
                </p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {available.map((room) => (
                  <Link
                    key={room.roomNumber}
                    href={`/dashboard/rooms/${room.roomNumber}`}
                    className="flex flex-col rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-bold">
                        {room.roomNumber}
                      </span>
                      <RoomStatusBadge status={room.status as DbRoomStatus} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {room.roomTypeName} · {room.floorLabel}
                    </p>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {formatCurrency(room.nightlyRate)}/night
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
