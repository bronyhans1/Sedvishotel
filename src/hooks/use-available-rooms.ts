"use client";

import { useEffect, useState, useTransition } from "react";

import { checkAvailabilityAction } from "@/features/reservations/actions";
import type { AvailableRoom } from "@/services/reservation.service";

type Params = {
  checkIn: string;
  checkOut: string;
  roomTypeId?: string;
  excludeReservationId?: string;
  enabled?: boolean;
};

export function useAvailableRooms({
  checkIn,
  checkOut,
  roomTypeId,
  excludeReservationId,
  enabled = true,
}: Params) {
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled || !checkIn || !checkOut || checkOut <= checkIn) {
      setRooms([]);
      setError(null);
      return;
    }

    startTransition(async () => {
      const result = await checkAvailabilityAction(
        checkIn,
        checkOut,
        roomTypeId,
        excludeReservationId
      );
      if (result.success) {
        setRooms(result.rooms);
        setError(null);
      } else {
        setRooms([]);
        setError(result.error);
      }
    });
  }, [checkIn, checkOut, roomTypeId, excludeReservationId, enabled]);

  return { rooms, loading: isPending, error };
}
