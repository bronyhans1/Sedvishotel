import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getReservationAccess } from "@/lib/auth/reservation-access";
import { sessionHasPermission } from "@/lib/auth/permissions";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { computeReservationStats } from "@/lib/reservations/mapper";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { getRoomTypeService } from "@/lib/room-types/get-room-type-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Reservation } from "@/types/reservation";

export type ReservationRoomOption = {
  roomNumber: string;
  label: string;
};

import type { RoomTypePricingRule } from "@/types/pricing";

export type ReservationRoomTypeOption = {
  id: string;
  name: string;
  defaultPrice: number;
  pricingRules: RoomTypePricingRule[];
};

function deriveReservationRoomTypeOptions(
  reservations: Reservation[]
): ReservationRoomTypeOption[] {
  const byId = new Map<string, string>();
  for (const reservation of reservations) {
    if (!reservation.roomTypeId) continue;
    byId.set(reservation.roomTypeId, reservation.roomTypeName);
  }
  return [...byId.entries()]
    .map(([id, name]) => ({
      id,
      name,
      defaultPrice: 0,
      pricingRules: [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadReservationsPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getReservationAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const reservationService = await getReservationService();
  const reservations = await reservationService.listReservations(ctx, session);

  const stats = computeReservationStats(reservations);

  let roomTypeOptions = deriveReservationRoomTypeOptions(reservations);
  if (access.canCreate && sessionHasPermission(session, "room_types", "view")) {
    const roomTypeService = await getRoomTypeService();
    const roomTypes = await roomTypeService.list(ctx, session);
    roomTypeOptions = roomTypes
      .filter((rt) => rt.status === "active")
      .map((rt) => ({
        id: rt.id,
        name: rt.name,
        defaultPrice: rt.defaultPrice,
        pricingRules: rt.pricingRules,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return { reservations, stats, access, roomTypeOptions };
}
