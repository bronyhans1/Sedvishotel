import { folioMatchesListFilters, type FolioListFilters } from "@/lib/folio/list-order";
import type { FolioListItem, FolioStatusFilter, FolioBalanceFilter } from "@/types/folio";

export function filterFolioList(
  items: FolioListItem[],
  search: string,
  status: FolioStatusFilter,
  balanceFilter: FolioBalanceFilter
): FolioListItem[] {
  const filters: FolioListFilters = { search, status, balance: balanceFilter };
  return items.filter((item) => folioMatchesListFilters(item, filters));
}
