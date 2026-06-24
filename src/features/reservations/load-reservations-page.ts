import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getReservationAccess } from "@/lib/auth/reservation-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { computeReservationStats } from "@/lib/reservations/mapper";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { getRoomService } from "@/lib/rooms/get-room-service";
import { getRoomTypeService } from "@/lib/room-types/get-room-type-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ReservationRoomOption = {
  roomNumber: string;
  label: string;
};

export type ReservationRoomTypeOption = {
  id: string;
  name: string;
};

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
  const roomService = await getRoomService();
  const roomTypeService = await getRoomTypeService();

  const [reservations, rooms, roomTypes] = await Promise.all([
    reservationService.listReservations(ctx, session),
    roomService.list(ctx, session),
    roomTypeService.list(ctx, session),
  ]);

  const stats = computeReservationStats(reservations);
  const roomOptions: ReservationRoomOption[] = rooms.map((r) => ({
    roomNumber: r.roomNumber,
    label: `${r.roomNumber} — ${r.roomType}`}));
  const roomTypeOptions: ReservationRoomTypeOption[] = roomTypes.map((t) => ({
    id: t.id,
    name: t.name}));

  return { reservations, stats, access, roomOptions, roomTypeOptions };
}
