import { computeStayPricing, formatRatePercentLabel } from "@/lib/reservations/pricing";
import type {
  BookingConfirmation,
  BookingGuest,
  BookingSearch,
  PublicBookingPricingSettings,
  PublicRoom,
} from "@/types/public";

export function calculateBookingPricing(
  room: PublicRoom,
  checkIn: string,
  checkOut: string,
  settings: PublicBookingPricingSettings
) {
  const result = computeStayPricing({
    roomRate: room.pricePerNight,
    checkIn,
    checkOut,
    taxRate: settings.taxRate,
    serviceChargeRate: settings.serviceCharge,
  });

  return {
    nights: result.numberOfNights,
    subtotal: result.subtotal,
    taxes: result.taxes,
    service: result.serviceCharge,
    total: result.totalAmount,
    taxLabel: formatRatePercentLabel(settings.taxRate),
    serviceLabel: formatRatePercentLabel(settings.serviceCharge),
    currency: settings.currency,
  };
}

export const BOOKING_STORAGE_KEY = "sedvis_public_booking";
