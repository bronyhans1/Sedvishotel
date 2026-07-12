import type { GroupListItem } from "@/features/group-reservations/load-group-pages";
import type {
  GroupReservationStatus,
  GroupReservationType,
} from "@/types/group-reservation";

export type GroupFilterState = {
  search: string;
  status: GroupReservationStatus | "all";
  groupType: GroupReservationType | "all";
  arrivalFrom: string;
  arrivalTo: string;
  departureFrom: string;
  departureTo: string;
  company: string;
};

export function filterGroups(
  groups: GroupListItem[],
  filters: GroupFilterState
): GroupListItem[] {
  const q = filters.search.trim().toLowerCase();

  return groups.filter((g) => {
    if (filters.status !== "all" && g.status !== filters.status) return false;
    if (filters.groupType !== "all" && g.groupType !== filters.groupType) return false;
    if (filters.arrivalFrom && g.arrivalDate < filters.arrivalFrom) return false;
    if (filters.arrivalTo && g.arrivalDate > filters.arrivalTo) return false;
    if (filters.departureFrom && g.departureDate < filters.departureFrom) return false;
    if (filters.departureTo && g.departureDate > filters.departureTo) return false;
    if (filters.company && g.corporateAccountName !== filters.company) return false;

    if (q) {
      const haystack = [
        g.groupName,
        g.groupNumber,
        g.corporateAccountName ?? "",
        g.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}
