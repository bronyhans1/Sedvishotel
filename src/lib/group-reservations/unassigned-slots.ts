import type { Reservation } from "@/types/reservation";

export type GroupStayWindow = {
  checkIn: string;
  checkOut: string;
};

/** Assignment uses the group's stay, not the business date. */
export function groupAssignmentStayWindow(group: {
  arrivalDate: string;
  departureDate: string;
}): GroupStayWindow {
  return {
    checkIn: group.arrivalDate.slice(0, 10),
    checkOut: group.departureDate.slice(0, 10),
  };
}

export function reservationNeedsRoom(reservation: Pick<Reservation, "status" | "roomNumber">): boolean {
  return (
    reservation.status !== "cancelled" &&
    reservation.status !== "checked_out" &&
    reservation.status !== "checked_out_early" &&
    !reservation.roomNumber
  );
}

/**
 * Expected rooms that have neither an assigned reservation nor an existing
 * unassigned member row. Those slots are why the alert can be non-zero while
 * the reservation table has no rows.
 */
export function unassignedPlaceholderCount(
  expectedRooms: number,
  reservations: readonly Pick<Reservation, "status" | "roomNumber">[]
): number {
  const roomsAssigned = reservations.filter(
    (reservation) => reservation.roomNumber && reservation.status !== "cancelled"
  ).length;
  const waiting = reservations.filter((reservation) => reservationNeedsRoom(reservation)).length;
  const remaining = Math.max(0, expectedRooms - roomsAssigned);
  return Math.max(0, remaining - waiting);
}
