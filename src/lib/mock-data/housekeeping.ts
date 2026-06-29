import { mockRooms } from "@/lib/mock-data/rooms";
import type { HousekeepingStats, HousekeepingTask } from "@/types/housekeeping";
import type { CleaningStatus } from "@/types/housekeeping";

const STAFF = [
  "Adjoa Mensah",
  "Kofi Annan",
  "Akosua Boateng",
  "Emmanuel Osei",
  "Unassigned",
];

function roomToTask(
  roomNumber: string,
  status: CleaningStatus,
  index: number
): HousekeepingTask {
  const room = mockRooms.find((r) => r.roomNumber === roomNumber)!;
  return {
    id: `hk_${roomNumber}`,
    roomId: `room_${roomNumber}`,
    roomNumber,
    roomTypeName: room.roomType,
    floorLabel: room.floorLabel,
    status,
    assignedStaff:
      status === "pending_cleaning" ? "Unassigned" : STAFF[index % STAFF.length],
    notes: status === "maintenance" ? "Awaiting maintenance review" : "",
    lastGuest: status !== "ready" ? "Previous guest" : "—",
    lastCheckoutTime:
      status === "pending_cleaning" ? "2026-06-02 · 10:30 AM" : "—",
    expectedCompletion:
      status === "cleaning"
        ? "2026-06-02 · 2:00 PM"
        : status === "pending_cleaning"
          ? "2026-06-02 · 3:00 PM"
          : "—",
  };
}

export function buildInitialHousekeepingTasks(): HousekeepingTask[] {
  const tasks: HousekeepingTask[] = [];
  let i = 0;

  for (const room of mockRooms) {
    if (room.status === "cleaning") {
      tasks.push(roomToTask(room.roomNumber, "cleaning", i++));
    } else if (room.status === "maintenance") {
      tasks.push(roomToTask(room.roomNumber, "maintenance", i++));
    }
  }

  const pendingRooms = ["006", "016", "022"];
  for (const num of pendingRooms) {
    if (!tasks.find((t) => t.roomNumber === num)) {
      tasks.push(roomToTask(num, "pending_cleaning", i++));
    }
  }

  const readyRooms = ["001", "007", "014", "019", "023"];
  for (const num of readyRooms) {
    if (!tasks.find((t) => t.roomNumber === num)) {
      const room = mockRooms.find((r) => r.roomNumber === num)!;
      tasks.push({
        id: `hk_${num}`,
        roomId: `room_${num}`,
        roomNumber: num,
        roomTypeName: room.roomType,
        floorLabel: room.floorLabel,
        status: "ready",
        assignedStaff: STAFF[i % STAFF.length],
        notes: "Inspected and ready for guest",
        lastGuest: "—",
        lastCheckoutTime: "—",
        expectedCompletion: "—",
      });
      i++;
    }
  }

  return tasks;
}

export const mockHousekeepingTasks = buildInitialHousekeepingTasks();

export function computeHousekeepingStats(
  tasks: HousekeepingTask[]
): HousekeepingStats {
  return {
    pendingCleaning: tasks.filter((t) => t.status === "pending_cleaning").length,
    currentlyCleaning: tasks.filter((t) => t.status === "cleaning").length,
    readyRooms: tasks.filter((t) => t.status === "ready").length,
    maintenanceRooms: tasks.filter((t) => t.status === "maintenance").length,
  };
}

export const mockHousekeepingStats =
  computeHousekeepingStats(mockHousekeepingTasks);
