import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import {
  buildFolioListQuery,
  parseFolioSearchParams,
} from "@/features/folio/lib/parse-folio-search-params";
import { getGuestFolioAccess } from "@/lib/auth/guest-folio-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { loadReservationFinanceContext } from "@/lib/documents/load-reservation-finance-context";
import { getGuestFolioService } from "@/lib/folio/get-guest-folio-service";
import { parsePageParam } from "@/lib/pagination/pagination";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadFolioListPageData(
  params: Record<string, string | string[] | undefined> = {}
) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getGuestFolioAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getGuestFolioService();
  const filters = parseFolioSearchParams(params);
  const requestedPage = parsePageParam(params.page);
  const folioPage = await service.listFolioPage(ctx, session, {
    page: requestedPage,
    filters,
  });

  if (folioPage.page !== requestedPage) {
    const query = buildFolioListQuery(filters, folioPage.page);
    redirect(query ? `/dashboard/guest-folio?${query}` : "/dashboard/guest-folio");
  }

  return {
    folios: folioPage.folios,
    total: folioPage.total,
    page: folioPage.page,
    pageSize: folioPage.pageSize,
    filters,
    access,
  };
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
