import type { AvailableRoom } from "@/services/reservation.service";
import type { ReservationRoomOption } from "@/features/reservations/load-reservations-page";
import type { WalkInRoomOption } from "@/types/walk-in";

export function mapAvailableRoomsToReservationOptions(
  rooms: AvailableRoom[]
): ReservationRoomOption[] {
  return rooms
    .map((room) => ({
      roomNumber: room.roomNumber,
      label: `${room.roomNumber} — ${room.roomTypeName}`,
    }))
    .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
}

export function mapAvailableRoomsToWalkInOptions(
  rooms: AvailableRoom[]
): WalkInRoomOption[] {
  return rooms
    .map((room) => ({
      id: room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomTypeName,
      price: room.nightlyRate,
      floorLabel: room.floorLabel,
    }))
    .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
}

/** Keep the current assignment visible when editing an existing reservation. */
export function mergeCurrentRoomOption(
  options: ReservationRoomOption[],
  current?: ReservationRoomOption | null
): ReservationRoomOption[] {
  if (!current?.roomNumber) return options;
  if (options.some((o) => o.roomNumber === current.roomNumber)) return options;
  return [current, ...options].sort((a, b) =>
    a.roomNumber.localeCompare(b.roomNumber)
  );
}
