import type { DbReservationBlock } from "@/types/database";
import type { ReservationBlock } from "@/types/reservation-block";

export function mapDbReservationBlockToReservationBlock(
  row: DbReservationBlock
): ReservationBlock {
  return {
    id: row.id,
    groupReservationId: row.group_reservation_id,
    roomId: row.room_id,
    roomTypeId: row.room_type_id,
    holdUntil: row.hold_until,
    releasedAt: row.released_at,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
