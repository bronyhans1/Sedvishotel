import { timeToMinutes } from "@/lib/dates/time";

export function canLateCheckOut(
  status: string,
  scheduledCheckOutDate: string,
  asOfDate: string,
  actualCheckoutTime: string,
  policyCheckOutTime: string
): boolean {
  return (
    status === "checked_in" &&
    asOfDate === scheduledCheckOutDate &&
    timeToMinutes(actualCheckoutTime) > timeToMinutes(policyCheckOutTime)
  );
}

export function isLateCheckoutReservation(lateCheckoutAt: string | null): boolean {
  return lateCheckoutAt != null;
}
