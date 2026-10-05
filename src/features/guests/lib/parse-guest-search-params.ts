import type { GuestListFilters } from "@/lib/guests/list-order";
import type { GuestStatus } from "@/types/guest";

const VALID_STATUSES = new Set<GuestStatus | "all">([
  "all",
  "in_house",
  "reserved",
  "checked_out",
]);

const defaultFilters: GuestListFilters = {
  search: "",
  status: "all",
};

export function parseGuestSearchParams(
  params: Record<string, string | string[] | undefined>
): GuestListFilters {
  const next: GuestListFilters = { ...defaultFilters };
  const search = typeof params.search === "string" ? params.search : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  if (search) next.search = search;
  if (status && VALID_STATUSES.has(status as GuestStatus | "all")) {
    next.status = status as GuestStatus | "all";
  }
  return next;
}

export function buildGuestListQuery(filters: GuestListFilters, page: number): string {
  const qs = new URLSearchParams();
  if (filters.search.trim()) qs.set("search", filters.search.trim());
  if (filters.status !== "all") qs.set("status", filters.status);
  if (page > 1) qs.set("page", String(page));
  return qs.toString();
}
