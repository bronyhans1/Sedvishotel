/**
 * Search foundation for group reservations and corporate accounts.
 * Indexes are created in migration 070; this module defines query contracts.
 */

export type GroupSearchScope =
  | "group_number"
  | "company"
  | "contact"
  | "reservation"
  | "guest"
  | "phone"
  | "email";

export type UnifiedGroupSearchQuery = {
  query: string;
  scopes?: GroupSearchScope[];
};

export type GroupSearchResult = {
  kind: "group" | "corporate" | "reservation" | "guest";
  id: string;
  label: string;
  sublabel?: string;
  href?: string;
};

export type GroupSearchContract = {
  search(query: UnifiedGroupSearchQuery): Promise<GroupSearchResult[]>;
};
