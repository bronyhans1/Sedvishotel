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
  /** Operational stay classification when guest/reservation is checked in. */
  departureClassification?:
    | "expected_departure"
    | "late_checkout"
    | "overstay"
    | "in_house"
    | null;
  departureLabel?: string | null;
};

export type GroupSearchContract = {
  search(query: UnifiedGroupSearchQuery): Promise<GroupSearchResult[]>;
};
