import { publicRooms } from "@/lib/mock-data/public-rooms";
import { getBedPreferenceLabel } from "@/lib/public/room-categories";
import type { PublicBedPreferenceId } from "@/lib/public/room-categories";
import { nightsBetween } from "@/lib/utils";
import type {
  BookingConfirmation,
  BookingGuest,
  BookingSearch,
  PublicRoom,
  ReservationLookupResult,
} from "@/types/public";

const TAX_RATE = 0.15;
const SERVICE_CHARGE = 0.05;

export function checkPublicAvailability(
  search: BookingSearch
): PublicRoom[] {
  const { adults, roomTypeId } = search;
  return publicRooms.filter((room) => {
    if (room.capacity < adults) return false;
    if (roomTypeId && room.id !== roomTypeId) return false;
    return true;
  });
}

export function calculateBookingPricing(
  room: PublicRoom,
  checkIn: string,
  checkOut: string
) {
  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = room.pricePerNight * nights;
  const taxes = Math.round(subtotal * TAX_RATE);
  const service = Math.round(subtotal * SERVICE_CHARGE);
  const total = subtotal + taxes + service;
  return { nights, subtotal, taxes, service, total };
}

export function createMockBooking(
  search: BookingSearch,
  room: PublicRoom,
  guest: BookingGuest,
  bedPreference?: PublicBedPreferenceId
): BookingConfirmation {
  const { nights, subtotal, taxes, total } = calculateBookingPricing(
    room,
    search.checkIn,
    search.checkOut
  );
  const num = `SHMS-2026-${String(Math.floor(1000 + Math.random() * 8999))}`;

  return {
    reservationNumber: num,
    guestName: guest.fullName,
    email: guest.email,
    roomName: room.name,
    roomSlug: room.slug,
    bedPreference,
    bedPreferenceLabel: bedPreference
      ? getBedPreferenceLabel(bedPreference)
      : undefined,
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    adults: search.adults,
    children: search.children,
    nights,
    subtotal,
    taxes,
    total,
    status: "confirmed",
    paymentStatus: "deposit_paid",
  };
}

const MOCK_LOOKUPS: ReservationLookupResult[] = [
  {
    reservationNumber: "SHMS-2026-0142",
    guestName: "Kwame Mensah",
    email: "kwame.mensah@email.com",
    roomName: "Deluxe Room",
    checkIn: "2026-06-05",
    checkOut: "2026-06-08",
    status: "Confirmed",
    paymentStatus: "Deposit Paid",
  },
  {
    reservationNumber: "SHMS-2026-0088",
    guestName: "Ama Osei",
    email: "ama.osei@email.com",
    roomName: "Standard Room",
    checkIn: "2026-06-02",
    checkOut: "2026-06-04",
    status: "Checked In",
    paymentStatus: "Fully Paid",
  },
];

export function lookupReservation(
  reservationNumber: string,
  email: string
): ReservationLookupResult | null {
  const normalized = reservationNumber.trim().toUpperCase();
  const emailLower = email.trim().toLowerCase();
  return (
    MOCK_LOOKUPS.find(
      (r) =>
        r.reservationNumber.toUpperCase() === normalized &&
        r.email.toLowerCase() === emailLower
    ) ?? null
  );
}

export const BOOKING_STORAGE_KEY = "sedvis_public_booking";
