import { hotelContact } from "@/config/hotel-contact";
import type { PublicHotelContactSettings } from "@/types/public";

/** Loads hotel contact fields for the public website from centralized config. */
export async function loadHotelContactSettings(): Promise<PublicHotelContactSettings> {
  return {
    phone: hotelContact.phoneDisplay,
    email: hotelContact.reservationsEmail,
    address: hotelContact.addressLines.join("\n"),
  };
}
