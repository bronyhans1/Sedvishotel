import type { FolioListItem, FolioStatusFilter, FolioBalanceFilter } from "@/types/folio";

export function filterFolioList(
  items: FolioListItem[],
  search: string,
  status: FolioStatusFilter,
  balanceFilter: FolioBalanceFilter
): FolioListItem[] {
  const normalized = search.trim().toLowerCase();

  return items.filter((item) => {
    if (status !== "all" && item.status !== status) return false;
    if (balanceFilter === "outstanding" && item.outstandingBalance <= 0) return false;
    if (balanceFilter === "paid" && item.outstandingBalance > 0) return false;
    if (!normalized) return true;
    return (
      item.guestName.toLowerCase().includes(normalized) ||
      item.roomNumber.toLowerCase().includes(normalized) ||
      item.reservationNumber.toLowerCase().includes(normalized) ||
      item.folioNumber.toLowerCase().includes(normalized)
    );
  });
}
