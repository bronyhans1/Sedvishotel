import { resolveFloorLabel } from "@/lib/rooms/mapper";
import type {
  DbHousekeepingStatus,
  DbHousekeepingTask,
  DbRoomWithType,
} from "@/types/database";
import type { CleaningStatus, HousekeepingTask } from "@/types/housekeeping";

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function resolveCleaningStatus(
  roomStatus: DbRoomWithType["status"],
  task?: DbHousekeepingTask | null
): CleaningStatus | null {
  if (roomStatus === "available") return "ready";
  if (roomStatus === "maintenance") return "maintenance";
  if (roomStatus === "cleaning") {
    if (task?.status === "cleaning" || task?.started_at) return "cleaning";
    return "pending_cleaning";
  }
  return null;
}

export function mapRoomToHousekeepingTask(
  room: DbRoomWithType,
  task?: DbHousekeepingTask | null,
  lastGuestName?: string | null,
  lastCheckoutAt?: string | null
): HousekeepingTask | null {
  const status = resolveCleaningStatus(room.status, task);
  if (!status) return null;

  return {
    id: task?.id ?? `room_${room.id}`,
    roomId: room.id,
    roomNumber: room.room_number,
    roomTypeName: room.room_type.name,
    floorLabel: resolveFloorLabel(room),
    status,
    assignedStaff: task?.assigned_staff_id ? "Assigned" : "Unassigned",
    notes: task?.notes ?? (status === "maintenance" ? "Awaiting maintenance review" : ""),
    lastGuest: lastGuestName ?? (status === "ready" ? "—" : "Previous guest"),
    lastCheckoutTime: formatTimestamp(lastCheckoutAt ?? task?.last_checkout_at ?? null),
    expectedCompletion: formatTimestamp(task?.expected_completion ?? null),
  };
}

export function computeHousekeepingStats(
  tasks: HousekeepingTask[]
): import("@/types/housekeeping").HousekeepingStats {
  return {
    pendingCleaning: tasks.filter((t) => t.status === "pending_cleaning").length,
    currentlyCleaning: tasks.filter((t) => t.status === "cleaning").length,
    readyRooms: tasks.filter((t) => t.status === "ready").length,
    maintenanceRooms: tasks.filter((t) => t.status === "maintenance").length,
  };
}
