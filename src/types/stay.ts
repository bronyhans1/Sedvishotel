import type { GuestStatus } from "@/types/guest";
import type { ReservationStatus } from "@/types/reservation";

export type ActiveStay = {
  id: string;
  reservationId: string;
  reservationNumber: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  roomNumber: string;
  roomTypeName: string;
  floorLabel: string;
  checkInDate: string;
  expectedCheckOut: string;
  status: ReservationStatus;
  guestStatus: GuestStatus;
  balance: number;
  specialRequests: string[];
  nights: number;
};

export type StayStats = {
  guestsInHouse: number;
  roomsOccupied: number;
  arrivalsToday: number;
  departuresToday: number;
};
