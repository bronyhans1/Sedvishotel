import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getGuestFolioAccess } from "@/lib/auth/guest-folio-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { loadReservationFinanceContext } from "@/lib/documents/load-reservation-finance-context";
import { getGuestFolioService } from "@/lib/folio/get-guest-folio-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadFolioListPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getGuestFolioAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getGuestFolioService();
  const folios = await service.listFolios(ctx, session);

  return { folios, access };
}

export async function loadFolioDetailPageData(folioId: string) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getGuestFolioAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getGuestFolioService();
  const folio = await service.getFolio(ctx, session, folioId);
  if (!folio) {
    redirect("/dashboard/guest-folio");
  }

  const finance = await loadReservationFinanceContext(
    ctx,
    session,
    folio.reservationId
  );

  return { folio, access, finance };
}
