import { computeHousekeepingStats } from "@/lib/housekeeping/mapper";
import type {
  CleaningStatus,
  HousekeepingStats,
  HousekeepingTask,
} from "@/types/housekeeping";

/** Confirmed server-success transitions applied locally for responsiveness. */
export type ConfirmedHousekeepingTransition =
  | "cleaning_started"
  | "cleaning_completed"
  | "room_ready"
  | "maintenance";

export type BoardStatusOverride = {
  roomId: string;
  fromStatus: CleaningStatus;
  toStatus: CleaningStatus;
  /** Monotonic token so later server props can reconcile safely. */
  confirmedAt: number;
};

export function nextStatusForConfirmedTransition(
  current: CleaningStatus,
  transition: ConfirmedHousekeepingTransition
): CleaningStatus | null {
  switch (transition) {
    case "cleaning_started":
      return current === "pending_cleaning" ? "cleaning" : null;
    case "cleaning_completed":
    case "room_ready":
      return current === "cleaning" || current === "maintenance" ? "ready" : null;
    case "maintenance":
      return current === "ready" ? "maintenance" : null;
    default:
      return null;
  }
}

export function applyConfirmedBoardTransition(
  tasks: HousekeepingTask[],
  roomId: string,
  transition: ConfirmedHousekeepingTransition
): { tasks: HousekeepingTask[]; override: BoardStatusOverride | null } {
  const current = tasks.find((t) => t.roomId === roomId);
  if (!current) {
    return { tasks, override: null };
  }

  const toStatus = nextStatusForConfirmedTransition(current.status, transition);
  if (!toStatus || toStatus === current.status) {
    return { tasks, override: null };
  }

  const nextTasks = tasks.map((task) => {
    if (task.roomId !== roomId) return task;
    const notes =
      toStatus === "maintenance" && !task.notes
        ? "Awaiting maintenance review"
        : task.notes;
    return { ...task, status: toStatus, notes };
  });

  return {
    tasks: nextTasks,
    override: {
      roomId,
      fromStatus: current.status,
      toStatus,
      confirmedAt: Date.now(),
    },
  };
}

/**
 * Merge authoritative server props with recent confirmed local overrides.
 * - Server already at expected status → drop override (reconciled).
 * - Server still at pre-transition status → keep local (stale props).
 * - Server at any other status → prefer server (external / authoritative change).
 * - Room missing from server while override expects it on board → keep local card
 *   only while server still looks stale for that room; if room vanished and we
 *   expected ready/maintenance board presence, fall through to server (drop).
 */
export function mergeBoardTasksWithOverrides(
  serverTasks: HousekeepingTask[],
  overrides: BoardStatusOverride[]
): { tasks: HousekeepingTask[]; overrides: BoardStatusOverride[] } {
  if (overrides.length === 0) {
    return { tasks: serverTasks, overrides: [] };
  }

  const byRoom = new Map(serverTasks.map((t) => [t.roomId, t]));
  const retained: BoardStatusOverride[] = [];
  const localPatches = new Map<string, HousekeepingTask>();

  for (const override of overrides) {
    const serverTask = byRoom.get(override.roomId);

    if (!serverTask) {
      // Room left the board entirely — trust server (e.g. became occupied).
      continue;
    }

    if (serverTask.status === override.toStatus) {
      // Authoritative props caught up.
      continue;
    }

    if (serverTask.status === override.fromStatus) {
      // Stale server props — keep confirmed local transition.
      retained.push(override);
      localPatches.set(override.roomId, {
        ...serverTask,
        status: override.toStatus,
        notes:
          override.toStatus === "maintenance" && !serverTask.notes
            ? "Awaiting maintenance review"
            : serverTask.notes,
      });
      continue;
    }

    // Divergent server status (other user / different transition) — trust server.
  }

  const tasks = serverTasks.map((task) => localPatches.get(task.roomId) ?? task);
  return { tasks, overrides: retained };
}

export function statsFromBoardTasks(tasks: HousekeepingTask[]): HousekeepingStats {
  return computeHousekeepingStats(tasks);
}

/** Ensures a room appears in exactly one column (no duplicate roomIds). */
export function assertUniqueRoomIds(tasks: HousekeepingTask[]): boolean {
  const seen = new Set<string>();
  for (const task of tasks) {
    if (seen.has(task.roomId)) return false;
    seen.add(task.roomId);
  }
  return true;
}
