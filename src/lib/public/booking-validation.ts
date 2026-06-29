/** Shared booking date rules for the public website and PublicBookingService. */
export function validateMinimumStay(checkIn: string, checkOut: string): string | null {
  if (!checkIn || !checkOut) {
    return "Check-in and check-out dates are required.";
  }
  if (checkOut <= checkIn) {
    return "Hotel reservations require a minimum stay of one night. Please choose a check-out date after your check-in date.";
  }
  return null;
}

export function buildCapacityMessage(adults: number): string {
  return `No available room can accommodate ${adults} adult${adults === 1 ? "" : "s"}. Please reduce the number of guests or reserve multiple rooms.`;
}
