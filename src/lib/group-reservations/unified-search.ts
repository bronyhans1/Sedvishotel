import { mapDbCorporateAccountToCorporateAccount } from "@/lib/corporate/mapper";
import { mapDbGroupReservationToGroupReservation } from "@/lib/group-reservations/mapper";
import { mapDbReservationToReservation } from "@/lib/reservations/mapper";
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

  const [groupRows, corpRows, guestRows, reservationRows] = await Promise.all([
    deps.groups.search(q),
    deps.corporate.search(q),
    deps.guests.getAll(false),
    deps.reservations.getAll(),
  ]);

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
      push({
        kind: "guest",
        id: row.id,
        label: row.full_name,
        sublabel: row.phone ?? row.email ?? undefined,
        href: `/dashboard/guests`,
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
      push({
        kind: "reservation",
        id: reservation.id,
        label: reservation.guestName,
        sublabel: reservation.reservationNumber,
        href: `/dashboard/reservations/${reservation.id}`,
      });
    }
  }

  return results.slice(0, 20);
}
