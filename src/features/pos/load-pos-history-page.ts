import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getPosAccess } from "@/lib/auth/pos-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getPosService } from "@/lib/pos/get-pos-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { POS_SALE_HISTORY_PAGE_SIZE } from "@/types/pos";

export async function loadPosHistoryPageData(searchParams?: {
  page?: string;
  search?: string;
  customerType?: string;
  paymentMethod?: string;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getPosAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const customerType =
    searchParams?.customerType === "walk_in" ||
    searchParams?.customerType === "room_charge"
      ? searchParams.customerType
      : undefined;
  const paymentMethod =
    searchParams?.paymentMethod === "cash" ||
    searchParams?.paymentMethod === "card" ||
    searchParams?.paymentMethod === "mobile_money" ||
    searchParams?.paymentMethod === "room_charge"
      ? searchParams.paymentMethod
      : undefined;

  const service = await getPosService();
  const [salesResult, cashiers] = await Promise.all([
    service.listSales(
      ctx,
      session,
      {
        search: searchParams?.search?.trim() || undefined,
        customerType,
        paymentMethod,
        cashierId: searchParams?.cashierId || undefined,
        dateFrom: searchParams?.dateFrom || undefined,
        dateTo: searchParams?.dateTo || undefined,
      },
      { page, pageSize: POS_SALE_HISTORY_PAGE_SIZE }
    ),
    service.listCashiers(ctx, session),
  ]);

  return {
    sales: salesResult.data,
    total: salesResult.total,
    page: salesResult.page,
    pageSize: salesResult.pageSize,
    cashiers,
    access,
    filters: {
      search: searchParams?.search ?? "",
      customerType: searchParams?.customerType ?? "all",
      paymentMethod: searchParams?.paymentMethod ?? "all",
      cashierId: searchParams?.cashierId ?? "",
      dateFrom: searchParams?.dateFrom ?? "",
      dateTo: searchParams?.dateTo ?? "",
    },
  };
}
