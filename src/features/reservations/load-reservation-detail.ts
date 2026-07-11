import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getReservationAccess } from "@/lib/auth/reservation-access";
import { getCheckOutAccess } from "@/lib/auth/check-out-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { getRoomTypeService } from "@/lib/room-types/get-room-type-service";
import { loadReservationFinanceContext } from "@/lib/documents/load-reservation-finance-context";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ReservationRoomTypeOption } from "@/features/reservations/load-reservations-page";

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
  const roomTypeService = await getRoomTypeService();

  const [reservation, roomTypes, checkoutPolicy, finance] = await Promise.all([
    reservationService.getReservationById(ctx, session, id),
    roomTypeService.list(ctx, session),
    loadCheckoutPolicy(),
    loadReservationFinanceContext(ctx, session, id),
  ]);

  if (!reservation) {
    notFound();
  }

  const roomTypeOptions: ReservationRoomTypeOption[] = roomTypes
    .filter((rt) => rt.status === "active")
    .map((rt) => ({ id: rt.id, name: rt.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    reservation,
    access,
    checkoutAccess,
    roomTypeOptions,
    checkoutPolicy,
    finance,
  };
}
