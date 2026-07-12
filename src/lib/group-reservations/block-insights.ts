import type { GroupOperationsOverview } from "@/lib/group-reservations/operations-overview";
import type { ReservationBlockInsights } from "@/types/group-operational-intelligence";
import type { ReservationBlock } from "@/types/reservation-block";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function buildReservationBlockInsights(
  overview: GroupOperationsOverview,
  blocks: ReservationBlock[]
): ReservationBlockInsights {
  const today = todayIso();
  const requested = overview.group.expectedRooms;

  const blocked = blocks.filter((b) => b.status === "blocked").length;
  const allocated = blocks.filter((b) => b.status === "allocated").length;
  const released = blocks.filter((b) => b.status === "released").length;
  const expired = blocks.filter((b) => b.status === "expired").length;
  const checkedIn = overview.roomsOccupied;
  const remaining = Math.max(0, requested - overview.roomsAssigned);

  const blocksExpiringToday = blocks.filter(
    (b) => b.status === "blocked" && b.holdUntil.slice(0, 10) === today
  ).length;

  const blocksExpiringWithin24h = blocks.filter((b) => {
    if (b.status !== "blocked") return false;
    const hold = new Date(b.holdUntil).getTime();
    return hold > Date.now() && hold <= Date.now() + 24 * 60 * 60 * 1000;
  }).length;

  const roomsAllocated = overview.roomsAssigned;
  const averageAllocationRate =
    requested > 0 ? Math.round((roomsAllocated / requested) * 100) : 0;

  const occupancyContribution =
    overview.expectedGuests > 0
      ? Math.round((overview.roomsOccupied / Math.max(1, requested)) * 100)
      : 0;

  const enrichedBlocks = blocks.map((b) => {
    const holdMs = b.status === "blocked" ? new Date(b.holdUntil).getTime() - Date.now() : null;
    const expiringSoon =
      holdMs != null && holdMs > 0 && holdMs <= 24 * 60 * 60 * 1000;
    return {
      ...b,
      countdownMs: holdMs,
      expiringSoon,
      occupancyImpact: b.status === "blocked" || b.status === "allocated" ? 1 : 0,
    };
  });

  return {
    roomsRequested: requested,
    roomsAllocated,
    roomsRemaining: remaining,
    roomsReleased: released,
    blocksExpiringToday,
    blocksExpiringWithin24h,
    averageAllocationRate,
    occupancyContribution,
    strip: {
      requested,
      blocked,
      allocated,
      checkedIn,
      released,
      expired,
      remaining,
      percentages: {
        blocked: pct(blocked, requested),
        allocated: pct(allocated, requested),
        checkedIn: pct(checkedIn, requested),
        released: pct(released, requested),
        expired: pct(expired, requested),
        remaining: pct(remaining, requested),
      },
    },
    blocks: enrichedBlocks,
  };
}
