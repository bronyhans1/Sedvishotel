"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { loadPublicRooms } from "@/lib/public/load-public-rooms";
import { getPublicBookingService } from "@/lib/public-booking/get-public-booking-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  BookingConfirmation,
  BookingGuest,
  BookingSearch,
  PublicRoom,
  ReservationLookupResult,
} from "@/types/public";

export async function checkPublicAvailabilityAction(
  search: BookingSearch
): Promise<
  | { success: true; rooms: PublicRoom[] }
  | {
      success: false;
      error: string;
      code?: "VALIDATION" | "NO_AVAILABILITY" | "CAPACITY";
      rooms: PublicRoom[];
    }
> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: "Online booking is temporarily unavailable.",
        rooms: [],
      };
    }

    const [service, catalog] = await Promise.all([
      getPublicBookingService(),
      loadPublicRooms(),
    ]);
    return service.checkAvailability(search, catalog);
  } catch (err) {
    unstable_rethrow(err);
    return {
      success: false,
      error: toSafeActionError(err),
      rooms: [],
    };
  }
}

export async function submitWebsiteReservationAction(input: {
  search: BookingSearch;
  roomTypeSlug: string;
  guest: BookingGuest;
  bedPreference?: string;
}): Promise<
  | { success: true; confirmation: BookingConfirmation }
  | { success: false; error: string }
> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: "Online booking is temporarily unavailable.",
      };
    }

    const service = await getPublicBookingService();
    const confirmation = await service.submitWebsiteReservation(input);

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/notifications");

    return { success: true, confirmation };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function lookupPublicReservationAction(input: {
  reservationNumber: string;
  phone: string;
}): Promise<
  | { success: true; result: ReservationLookupResult }
  | { success: false; error: string; notFound?: boolean }
> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: "Reservation lookup is temporarily unavailable.",
      };
    }

    const service = await getPublicBookingService();
    const result = await service.lookupReservation(
      input.reservationNumber,
      input.phone
    );

    if (!result) {
      return { success: false, error: "No reservation found.", notFound: true };
    }

    return { success: true, result };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
