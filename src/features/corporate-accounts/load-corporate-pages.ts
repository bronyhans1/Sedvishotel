import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getCorporateAccountAccess } from "@/lib/auth/corporate-account-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getCorporateAccountService } from "@/lib/corporate/get-corporate-account-service";
import { getGroupReservationService } from "@/lib/group-reservations/get-group-reservation-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CorporateAccount } from "@/types/corporate-account";

export type CorporateListItem = CorporateAccount & {
  outstandingBalance: number;
  groupCount: number;
};

export async function loadCorporateAccountsPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getCorporateAccountAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getCorporateAccountService();
  const accounts = await service.list(ctx, session);

  const items: CorporateListItem[] = [];
  for (const account of accounts) {
    const outstanding = await service.getOutstandingBalance(ctx, session, account.id);
    const groups = await service.getReservations(ctx, session, account.id);
    items.push({
      ...account,
      outstandingBalance: outstanding,
      groupCount: groups.length,
    });
  }

  return { accounts: items, access };
}

export async function loadCorporateDetailPageData(accountId: string) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getCorporateAccountAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getCorporateAccountService();
  const account = await service.find(ctx, session, accountId);
  if (!account) {
    redirect("/dashboard/corporate-accounts");
  }

  const [outstandingBalance, groups, invoices, payments] = await Promise.all([
    service.getOutstandingBalance(ctx, session, accountId),
    service.getReservations(ctx, session, accountId),
    service.getInvoices(ctx, session, accountId),
    service.getPaymentHistory(ctx, session, accountId),
  ]);

  const groupService = await getGroupReservationService();
  const groupSummaries = [];
  const financialByGroup = new Map<string, { charges: number; payments: number }>();
  const groupTimelines: Array<{
    groupId: string;
    groupNumber: string;
    events: Awaited<ReturnType<typeof groupService.getTimeline>>;
  }> = [];

  for (const g of groups) {
    const summary = await groupService.getSummary(ctx, session, g.id);
    if (summary) groupSummaries.push(summary);
    const fin = await groupService.getFinancialSummary(ctx, session, g.id);
    financialByGroup.set(g.id, {
      charges: fin?.totalCharges ?? 0,
      payments: fin?.totalPayments ?? 0,
    });
    const events = await groupService.getTimeline(ctx, session, g.id);
    groupTimelines.push({
      groupId: g.id,
      groupNumber: g.group_number,
      events,
    });
  }

  const { buildCorporateOperationalIntelligence } = await import(
    "@/lib/corporate/corporate-insights"
  );
  const intelligence = buildCorporateOperationalIntelligence(
    account,
    outstandingBalance,
    groups,
    groupSummaries,
    invoices,
    payments,
    financialByGroup,
    groupTimelines
  );

  return {
    account,
    outstandingBalance,
    groups: groupSummaries,
    invoices,
    payments,
    access,
    intelligence,
  };
}
