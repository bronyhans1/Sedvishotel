import type { DbGroupReservation } from "@/types/database";
import type { GroupReservation } from "@/types/group-reservation";

export function mapDbGroupReservationToGroupReservation(
  row: DbGroupReservation
): GroupReservation {
  return {
    id: row.id,
    groupNumber: row.group_number,
    groupName: row.group_name,
    groupType: row.group_type,
    status: row.status,
    billingPolicy: row.billing_policy,
    corporateAccountId: row.corporate_account_id,
    masterReservationId: row.master_reservation_id,
    arrivalDate: row.arrival_date,
    departureDate: row.departure_date,
    expectedRooms: row.expected_rooms,
    expectedGuests: row.expected_guests,
    actualRooms: row.actual_rooms,
    actualGuests: row.actual_guests,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
