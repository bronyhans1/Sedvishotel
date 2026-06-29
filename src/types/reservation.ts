import type { StayExtensionRecord } from "@/types/extend-stay";
import type { RoomMoveRecord } from "@/types/room-move";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "checked_out_early"
  | "cancelled"
  | "no_show";

export type BookingSource =
  | "website"
  | "walk_in"
  | "phone"
  | "whatsapp"
  | "travel_agent";

export type Reservation = {
  id: string;
  guestId: string;
  reservationNumber: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  floorLabel: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  status: ReservationStatus;
  bookingSource: BookingSource;
  roomRate: number;
  numberOfNights: number;
  subtotal: number;
  taxes: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  createdAt: string;
  createdById: string | null;
  originalCheckOutDate: string | null;
  actualCheckOutDate: string | null;
  earlyCheckOutReason: string | null;
  earlyCheckOutNotes: string | null;
  earlyCheckOutRefundAmount: number | null;
  lateCheckOutFee: number | null;
  lateCheckOutReason: string | null;
  lateCheckOutNotes: string | null;
  lateCheckOutAt: string | null;
  lateCheckOutComplimentary: boolean | null;
  lateCheckOutHoursLate: number | null;
  lateCheckOutPolicyType: string | null;
  stayExtensionHistory: StayExtensionRecord[];
  roomMoveHistory: RoomMoveRecord[];
};

export type ReservationStats = {
  total: number;
  pending: number;
  confirmed: number;
  checkedIn: number;
  checkedOut: number;
  cancelled: number;
};

export type ReservationFormValues = {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  bookingSource: BookingSource;
  status: ReservationStatus;
};

export type ReservationTimelineEvent = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  icon: "created" | "payment" | "confirmed" | "check-in" | "check-out";
};

export const RESERVATION_STATUS_OPTIONS: {
  value: ReservationStatus;
  label: string;
}[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "checked_out", label: "Checked Out" },
  { value: "checked_out_early", label: "Early Check-Out" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export const BOOKING_SOURCE_OPTIONS: {
  value: BookingSource;
  label: string;
}[] = [
  { value: "website", label: "Website" },
  { value: "walk_in", label: "Walk-In" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "travel_agent", label: "Travel Agent" },
];
