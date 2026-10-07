export function groupSectionId(tab: string): string | null {
  switch (tab) {
    case "reservations":
      return "group-reservation-reservations";
    case "guests":
      return "group-reservation-guests";
    case "timeline":
      return "group-reservation-timeline";
    case "folio":
      return "group-reservation-master-folio";
    case "blocks":
      return "group-reservation-blocks";
    case "invoices":
      return "group-reservation-invoices";
    case "payments":
      return "group-reservation-payments";
    case "activity":
      return "group-reservation-activity";
    default:
      return null;
  }
}

export const GROUP_SECTION_SCROLL_CLASS = "scroll-mt-20";

/** In-page quick actions. Links that leave this page are not included. */
export const IN_PAGE_QUICK_ACTION_TABS: Record<string, string> = {
  "Assign Rooms": "reservations",
  "Bulk Check-In": "reservations",
  "Bulk Check-Out": "reservations",
  "Open Timeline": "timeline",
  "View Blocks": "blocks",
};
