import { mapDbCorporateAccountToCorporateAccount } from "@/lib/corporate/mapper";
import { mapDbGroupReservationToGroupReservation } from "@/lib/group-reservations/mapper";
import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { getCurrentTimeString } from "@/lib/dates/time";
import { resolveDepartureClassification } from "@/lib/reservations/departure-classification";
import { mapDbReservationToReservation } from "@/lib/reservations/mapper";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import type { ICorporateAccountRepository } from "@/repositories/corporate-account.repository";
import type { IGroupReservationRepository } from "@/repositories/group-reservation.repository";
import type { IGuestRepository } from "@/repositories/guest.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type {
  GroupSearchResult,
  UnifiedGroupSearchQuery,
} from "@/lib/group-reservations/search-contract";

export async function executeUnifiedGroupSearch(
  deps: {
    groups: IGroupReservationRepository;
    corporate: ICorporateAccountRepository;
    reservations: IReservationRepository;
    guests: IGuestRepository;
  },
  query: UnifiedGroupSearchQuery
): Promise<GroupSearchResult[]> {
  const q = query.query.trim();
  if (!q || q.length < 2) return [];

  const results: GroupSearchResult[] = [];
  const seen = new Set<string>();

  function push(result: GroupSearchResult) {
    const key = `${result.kind}:${result.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(result);
  }

  const qLower = q.toLowerCase();

  const [groupRows, corpRows, guestRows, reservationRows, businessDate, policy] =
    await Promise.all([
      deps.groups.search(q),
      deps.corporate.search(q),
      deps.guests.getAll(false),
      deps.reservations.getAll(),
      getCurrentBusinessDate(),
      loadCheckoutPolicy(),
    ]);

  const currentTime = getCurrentTimeString();
  const reservations = reservationRows.map(mapDbReservationToReservation);
  const activeByGuestId = new Map<string, (typeof reservations)[number]>();
  for (const reservation of reservations) {
    if (reservation.status === "checked_in" && reservation.guestId) {
      activeByGuestId.set(reservation.guestId, reservation);
    }
  }

  function departureFields(reservation: (typeof reservations)[number] | undefined) {
    if (!reservation || reservation.status !== "checked_in") {
      return {
        departureClassification: null as GroupSearchResult["departureClassification"],
        departureLabel: null as string | null,
      };
    }
    const resolved = resolveDepartureClassification({
      status: reservation.status,
      checkInDate: reservation.checkInDate,
      scheduledCheckOutDate: reservation.checkOutDate,
      businessDate,
      currentTime,
      policyCheckOutTime: policy.checkOutTime,
    });
    const classification =
      resolved.classification === "expected_departure" ||
      resolved.classification === "late_checkout" ||
      resolved.classification === "overstay" ||
      resolved.classification === "in_house"
        ? resolved.classification
        : ("in_house" as const);
    return {
      departureClassification: classification,
      departureLabel:
        classification === "in_house" ? "Current Stay" : resolved.shortLabel,
    };
  }

  for (const row of groupRows) {
    const group = mapDbGroupReservationToGroupReservation(row);
    push({
      kind: "group",
      id: group.id,
      label: group.groupName,
      sublabel: group.groupNumber,
      href: `/dashboard/group-reservations/${group.id}`,
    });
  }

  for (const row of corpRows) {
    const corp = mapDbCorporateAccountToCorporateAccount(row);
    push({
      kind: "corporate",
      id: corp.id,
      label: corp.companyName,
      sublabel: corp.accountNumber,
      href: `/dashboard/corporate-accounts/${corp.id}`,
    });
  }

  for (const row of guestRows) {
    if (
      row.full_name.toLowerCase().includes(qLower) ||
      row.phone?.includes(q) ||
      row.email?.toLowerCase().includes(qLower)
    ) {
      const stay = activeByGuestId.get(row.id);
      const dep = departureFields(stay);
      push({
        kind: "guest",
        id: row.id,
        label: row.full_name,
        sublabel: stay
          ? `Room ${stay.roomNumber}${dep.departureLabel ? ` · ${dep.departureLabel}` : ""}`
          : row.phone ?? row.email ?? undefined,
        href: `/dashboard/guests/${row.id}`,
        ...dep,
      });
    }
  }

  for (const row of reservationRows) {
    const guestName = row.guest?.full_name ?? "";
    if (
      row.reservation_number.toLowerCase().includes(qLower) ||
      guestName.toLowerCase().includes(qLower) ||
      row.guest?.phone?.includes(q) ||
      row.guest?.email?.toLowerCase().includes(qLower)
    ) {
      const reservation = mapDbReservationToReservation(row);
      const dep = departureFields(reservation);
      push({
        kind: "reservation",
        id: reservation.id,
        label: reservation.guestName,
        sublabel: `${reservation.reservationNumber}${
          dep.departureLabel ? ` · ${dep.departureLabel}` : ""
        }`,
        href: `/dashboard/reservations/${reservation.id}`,
        ...dep,
      });
    }
  }

  return results.slice(0, 20);
}
