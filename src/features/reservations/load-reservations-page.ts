import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getReservationAccess } from "@/lib/auth/reservation-access";
import { getPaymentAccess } from "@/lib/auth/payment-access";
import { sessionHasPermission } from "@/lib/auth/permissions";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { parsePageParam } from "@/lib/pagination/pagination";
import {
  buildReservationListQuery,
  parseReservationSearchParams,
} from "@/features/reservations/lib/parse-reservation-search-params";
import { getRoomTypeService } from "@/lib/room-types/get-room-type-service";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import {
  getDefaultTaxRate,
  isGlobalVatEnabled,
} from "@/lib/settings/get-tax-rate";
import { loadTaxAndChargeSettings } from "@/lib/settings/pricing-settings";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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

export async function loadReservationsPageData(
  params: Record<string, string | string[] | undefined> = {}
) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getReservationAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const reservationService = await getReservationService();
  const paymentAccess = getPaymentAccess(session);
  const filters = parseReservationSearchParams(params);
  const requestedPage = parsePageParam(params.page);
  const businessDate = await getCurrentBusinessDate();
  const [reservationPage, stats, checkoutPolicy, defaultTaxRate, taxSettings] =
    await Promise.all([
      reservationService.listReservationPage(ctx, session, {
        page: requestedPage,
        businessDate,
        filters,
      }),
      reservationService.getReservationListStats(ctx, session),
      loadCheckoutPolicy(),
      getDefaultTaxRate(),
      loadTaxAndChargeSettings(),
    ]);

  if (reservationPage.page !== requestedPage) {
    const query = buildReservationListQuery(filters, reservationPage.page);
    redirect(query ? `/dashboard/reservations?${query}` : "/dashboard/reservations");
  }

  let roomTypeOptions: ReservationRoomTypeOption[];
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
  } else {
    const labels = await reservationService.listReservationRoomTypeOptions(ctx, session);
    roomTypeOptions = labels.map((label) => ({
      id: label.id,
      name: label.name,
      defaultPrice: 0,
      pricingRules: [],
    }));
  }

  return {
    reservations: reservationPage.reservations,
    total: reservationPage.total,
    page: reservationPage.page,
    pageSize: reservationPage.pageSize,
    filters,
    stats,
    access,
    roomTypeOptions,
    businessDate,
    checkoutPolicy,
    defaultTaxRate,
    defaultVatApplied: isGlobalVatEnabled(defaultTaxRate),
    serviceChargeRate: taxSettings.serviceCharge,
    requireRateOverrideApproval: taxSettings.requireRateOverrideApproval ?? false,
    canOverrideVat: paymentAccess.canOverrideVat,
  };
}
