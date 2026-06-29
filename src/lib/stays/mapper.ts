import { resolveFloorLabel } from "@/lib/rooms/mapper";
import type { DbReservationWithRelations } from "@/types/database";
import type { ActiveStay } from "@/types/stay";

function parseSpecialRequests(value: string | null): string[] {
  if (!value?.trim()) return [];
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function mapReservationToActiveStay(
  row: DbReservationWithRelations
): ActiveStay {
  const guest = row.guest;
  const room = row.room;
  const roomType = row.room_type;

  return {
    id: `stay_${row.id}`,
    reservationId: row.id,
    reservationNumber: row.reservation_number,
    guestId: guest.id,
    guestName: guest.full_name,
    guestPhone: guest.phone ?? "",
    guestEmail: guest.email ?? "",
    roomNumber: room.room_number,
    roomTypeName: roomType.name,
    floorLabel: resolveFloorLabel(room),
    checkInDate: row.check_in_date,
    expectedCheckOut: row.check_out_date,
    status: "checked_in",
    guestStatus: guest.guest_status,
    balance: Number(row.balance),
    specialRequests: parseSpecialRequests(row.special_requests),
    nights: row.number_of_nights,
  };
}

export function buildActiveStaysFromReservations(
  rows: DbReservationWithRelations[]
): ActiveStay[] {
  return rows.map(mapReservationToActiveStay);
}
