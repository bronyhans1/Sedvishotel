import type {
  GroupIntelligenceContext,
  SmartAlert,
  SmartAlertAction,
} from "@/types/group-operational-intelligence";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function alert(
  id: string,
  severity: SmartAlert["severity"],
  message: string,
  suggestedAction: string,
  action?: SmartAlertAction,
  href?: string,
  tab?: string
): SmartAlert {
  return { id, severity, message, suggestedAction, action, href, tab };
}

export function deriveSmartAlerts(
  ctx: GroupIntelligenceContext,
  groupId: string
): SmartAlert[] {
  const { overview, blocks, timeline, financial, corporateAccount } = ctx;
  const alerts: SmartAlert[] = [];
  const today = todayIso();
  const base = `/dashboard/group-reservations/${groupId}`;

  if (overview.outstandingBalance > 0) {
    alerts.push(
      alert(
        "outstanding-balance",
        overview.outstandingBalance > 5000 ? "critical" : "warning",
        `Outstanding balance of ${overview.outstandingBalance.toFixed(2)} on this group.`,
        "Review master folio and collect payment.",
        "open_master_folio",
        financial?.masterFolioId
          ? `/dashboard/guest-folio/${financial.masterFolioId}`
          : `${base}?tab=folio`,
        "folio"
      )
    );
  }

  if (overview.corporateCreditStatus === "exceeded") {
    alerts.push(
      alert(
        "credit-exceeded",
        "critical",
        "Corporate credit limit has been exceeded.",
        "Contact accounts receivable and review company billing.",
        "view_company",
        corporateAccount ? `/dashboard/corporate-accounts/${corporateAccount.id}` : undefined
      )
    );
  } else if (overview.corporateCreditStatus === "warning") {
    alerts.push(
      alert(
        "credit-warning",
        "warning",
        "Corporate account is approaching its credit limit.",
        "Monitor outstanding balance before adding charges.",
        "view_company",
        corporateAccount ? `/dashboard/corporate-accounts/${corporateAccount.id}` : undefined
      )
    );
  }

  const blocksExpiringToday = blocks.filter((b) => {
    if (b.status !== "blocked") return false;
    return b.holdUntil.slice(0, 10) === today;
  });
  if (blocksExpiringToday.length > 0) {
    alerts.push(
      alert(
        "blocks-expiring-today",
        "critical",
        `${blocksExpiringToday.length} reservation block(s) expire today.`,
        "Confirm allocations or extend holds before release.",
        "view_blocks",
        `${base}?tab=blocks`,
        "blocks"
      )
    );
  }

  const blocksExpiring24h = blocks.filter((b) => {
    if (b.status !== "blocked") return false;
    const hold = new Date(b.holdUntil).getTime();
    return hold > Date.now() && hold <= Date.now() + 24 * 60 * 60 * 1000;
  });
  if (blocksExpiring24h.length > 0 && blocksExpiringToday.length === 0) {
    alerts.push(
      alert(
        "blocks-expiring-24h",
        "warning",
        `${blocksExpiring24h.length} reservation block(s) expire within 24 hours.`,
        "Review block status and confirm room allocations.",
        "view_blocks",
        `${base}?tab=blocks`,
        "blocks"
      )
    );
  }

  const unassignedGuests = overview.reservations.filter(
    (r) =>
      r.status !== "cancelled" &&
      r.status !== "checked_out" &&
      r.status !== "checked_out_early" &&
      !r.roomNumber
  );
  if (unassignedGuests.length > 0) {
    alerts.push(
      alert(
        "guests-unassigned",
        "warning",
        `${unassignedGuests.length} guest(s) not assigned to rooms.`,
        "Assign rooms before arrival.",
        "assign_rooms",
        `${base}?tab=reservations`,
        "reservations"
      )
    );
  }

  const blockedNotAllocated = blocks.filter((b) => b.status === "blocked").length;
  if (blockedNotAllocated > 0 && overview.roomsAssigned < overview.group.expectedRooms) {
    alerts.push(
      alert(
        "blocks-not-allocated",
        "warning",
        `${blockedNotAllocated} room(s) blocked but not yet allocated to reservations.`,
        "Convert blocks to confirmed reservations.",
        "view_blocks",
        `${base}?tab=blocks`,
        "blocks"
      )
    );
  }

  if (overview.vipArrivalsToday > 0) {
    alerts.push(
      alert(
        "vip-arrivals",
        "information",
        `${overview.vipArrivalsToday} VIP guest(s) arriving today.`,
        "Prepare VIP amenities and room assignments.",
        "view_reservations",
        `${base}?tab=guests`,
        "guests"
      )
    );
  }

  if (overview.returningArrivalsToday > 0) {
    alerts.push(
      alert(
        "returning-arrivals",
        "information",
        `${overview.returningArrivalsToday} returning guest(s) arriving today.`,
        "Review guest preferences and history.",
        "view_reservations",
        `${base}?tab=guests`,
        "guests"
      )
    );
  }

  if (overview.pendingCheckInsToday > 0) {
    alerts.push(
      alert(
        "pending-checkins",
        overview.pendingCheckInsToday > 5 ? "warning" : "information",
        `${overview.pendingCheckInsToday} pending check-in(s) scheduled for today.`,
        "Process bulk check-in for arriving guests.",
        "bulk_check_in",
        `${base}?tab=reservations`,
        "reservations"
      )
    );
  }

  if (overview.pendingCheckOutsToday > 0) {
    alerts.push(
      alert(
        "pending-checkouts",
        "warning",
        `${overview.pendingCheckOutsToday} pending check-out(s) scheduled for today.`,
        "Settle folios and process departures.",
        "bulk_check_out",
        `${base}?tab=reservations`,
        "reservations"
      )
    );
  }

  const openIssues = timeline.filter(
    (e) => e.eventType === "issue_created"
  ).length - timeline.filter((e) => e.eventType === "issue_closed").length;
  if (openIssues > 0) {
    alerts.push(
      alert(
        "open-issues",
        "warning",
        `${openIssues} open operational issue(s) on this group.`,
        "Review and resolve outstanding issues.",
        "resolve_issue",
        `${base}?tab=timeline`,
        "timeline"
      )
    );
  }

  if ((ctx.shiftHandoverOpenIssues ?? 0) > 0) {
    alerts.push(
      alert(
        "shift-handover-issues",
        "information",
        `${ctx.shiftHandoverOpenIssues} open shift handover item(s) may affect operations.`,
        "Review shift handover before group operations.",
        "resolve_issue",
        "/dashboard/shift-handover"
      )
    );
  }

  if (
    overview.outstandingBalance > 0 &&
    overview.group.departureDate <= today &&
    overview.checkedInCount > 0
  ) {
    alerts.push(
      alert(
        "payment-overdue",
        "critical",
        "Group has checked-in guests with outstanding balance past departure.",
        "Collect payment before final check-out.",
        "record_payment",
        `${base}?tab=payments`,
        "payments"
      )
    );
  }

  if (
    overview.group.billingPolicy === "deposit" &&
    overview.outstandingBalance > 0 &&
    (financial?.totalPayments ?? 0) === 0
  ) {
    alerts.push(
      alert(
        "deposit-outstanding",
        "warning",
        "Deposit billing policy — no deposit payment recorded yet.",
        "Collect deposit before confirming allocations.",
        "collect_deposit",
        `${base}?tab=folio`,
        "folio"
      )
    );
  }

  if (corporateAccount && !corporateAccount.billingContactEmail && !corporateAccount.billingContactPhone) {
    alerts.push(
      alert(
        "missing-billing-contact",
        "warning",
        "Corporate billing contact details are missing.",
        "Update company profile with billing contact.",
        "view_company",
        `/dashboard/corporate-accounts/${corporateAccount.id}`
      )
    );
  }

  if (corporateAccount && !corporateAccount.billingAddress) {
    alerts.push(
      alert(
        "missing-company-details",
        "information",
        "Corporate billing address is not on file.",
        "Complete company profile for invoicing.",
        "view_company",
        `/dashboard/corporate-accounts/${corporateAccount.id}`
      )
    );
  }

  if (overview.roomsRemaining > 0 && overview.group.arrivalDate <= today) {
    alerts.push(
      alert(
        "missing-room-assignments",
        overview.roomsRemaining > 3 ? "critical" : "warning",
        `${overview.roomsRemaining} room(s) still unassigned for this group.`,
        "Assign remaining rooms to meet expected occupancy.",
        "assign_rooms",
        `${base}?tab=reservations`,
        "reservations"
      )
    );
  }

  const guestNames = overview.reservations
    .filter((r) => r.guestName && r.status !== "cancelled")
    .map((r) => r.guestName.trim().toLowerCase());
  const duplicates = guestNames.filter((n, i) => guestNames.indexOf(n) !== i);
  if (duplicates.length > 0) {
    alerts.push(
      alert(
        "duplicate-guest",
        "information",
        "Duplicate guest name detected across reservations.",
        "Verify guest assignments are intentional.",
        "view_reservations",
        `${base}?tab=guests`,
        "guests"
      )
    );
  }

  const cancelledNeedingRealloc = overview.reservations.filter(
    (r) => r.status === "cancelled" && overview.group.arrivalDate >= today
  );
  if (cancelledNeedingRealloc.length > 0 && overview.roomsRemaining > 0) {
    alerts.push(
      alert(
        "cancelled-reallocation",
        "warning",
        `${cancelledNeedingRealloc.length} cancelled room(s) may require reallocation.`,
        "Review cancelled reservations and reassign rooms.",
        "assign_rooms",
        `${base}?tab=reservations`,
        "reservations"
      )
    );
  }

  const severityOrder = { critical: 0, warning: 1, information: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
