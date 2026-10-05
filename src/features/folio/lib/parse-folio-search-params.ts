import type { FolioListFilters } from "@/lib/folio/list-order";
import type { FolioBalanceFilter, FolioStatusFilter } from "@/types/folio";

const VALID_STATUSES = new Set<FolioStatusFilter>(["all", "open", "closed", "archived"]);
const VALID_BALANCES = new Set<FolioBalanceFilter>(["all", "outstanding", "paid"]);

const defaultFilters: FolioListFilters = {
  search: "",
  status: "all",
  balance: "all",
};

export function parseFolioSearchParams(
  params: Record<string, string | string[] | undefined>
): FolioListFilters {
  const next: FolioListFilters = { ...defaultFilters };
  const search = typeof params.search === "string" ? params.search : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const balance = typeof params.balance === "string" ? params.balance : undefined;
  if (search) next.search = search;
  if (status && VALID_STATUSES.has(status as FolioStatusFilter)) {
    next.status = status as FolioStatusFilter;
  }
  if (balance && VALID_BALANCES.has(balance as FolioBalanceFilter)) {
    next.balance = balance as FolioBalanceFilter;
  }
  return next;
}

export function buildFolioListQuery(filters: FolioListFilters, page: number): string {
  const qs = new URLSearchParams();
  if (filters.search.trim()) qs.set("search", filters.search.trim());
  if (filters.status !== "all") qs.set("status", filters.status);
  if (filters.balance !== "all") qs.set("balance", filters.balance);
  if (page > 1) qs.set("page", String(page));
  return qs.toString();
}
