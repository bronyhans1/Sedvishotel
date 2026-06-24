import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getReservationAccess } from "@/lib/auth/reservation-access";
import { getCheckOutAccess } from "@/lib/auth/check-out-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import { getRoomService } from "@/lib/rooms/get-room-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ReservationRoomOption } from "@/features/reservations/load-reservations-page";

export async function loadReservationDetail(id: string) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getReservationAccess(session);
  const checkoutAccess = getCheckOutAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const reservationService = await getReservationService();
  const roomService = await getRoomService();

  const [reservation, rooms, checkoutPolicy] = await Promise.all([
    reservationService.getReservationById(ctx, session, id),
    roomService.list(ctx, session),
    loadCheckoutPolicy(),
  ]);

  if (!reservation) {
    notFound();
  }

  const roomOptions: ReservationRoomOption[] = rooms.map((r) => ({
    roomNumber: r.roomNumber,
    label: `${r.roomNumber} — ${r.roomType}`}));

  return { reservation, access, checkoutAccess, roomOptions, checkoutPolicy };
}
