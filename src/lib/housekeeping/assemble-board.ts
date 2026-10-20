import {
  computeHousekeepingStats,
  mapRoomToHousekeepingTask,
} from "@/lib/housekeeping/mapper";
import { resolveDepartureClassification } from "@/lib/reservations/departure-classification";
import { resolveFloorLabel } from "@/lib/rooms/mapper";
import type { HousekeepingCheckedInRow, HousekeepingLatestCheckout } from "@/repositories/reservation.repository";
import type { CheckoutPolicy } from "@/types/late-checkout";
import type { DbHousekeepingTask, DbRoomWithType } from "@/types/database";
import type { HousekeepingStats, HousekeepingTask } from "@/types/housekeeping";

export type AssembleHousekeepingBoardInput = {
  rooms: DbRoomWithType[];
  boardRooms: DbRoomWithType[];
  housekeepingTasks: DbHousekeepingTask[];
  checkouts: HousekeepingLatestCheckout[];
  checkedIn: HousekeepingCheckedInRow[];
  businessDate: string;
  currentTime: string;
  policy: CheckoutPolicy;
};

export function assembleHousekeepingBoard(input: AssembleHousekeepingBoardInput): {
  tasks: HousekeepingTask[];
  stats: HousekeepingStats;
  departureWatch: HousekeepingTask[];
} {
  const taskByRoomId = new Map(
    input.housekeepingTasks.map((task) => [task.room_id, task])
  );
  const checkoutByRoomId = new Map(
    input.checkouts.map((checkout) => [checkout.roomId, checkout])
  );

  const tasks: HousekeepingTask[] = [];
  for (const room of input.boardRooms) {
    const hkTask = taskByRoomId.get(room.id) ?? null;
    const checkout = checkoutByRoomId.get(room.id);
    const mapped = mapRoomToHousekeepingTask(
      room,
      hkTask,
      checkout?.guestName ?? null,
      checkout?.checkoutAt ?? null
    );
    if (mapped) tasks.push(mapped);
  }

  const roomsByNumber = new Map(
    input.rooms.map((room) => [room.room_number, room])
  );
  const departureWatch: HousekeepingTask[] = [];
  for (const reservation of input.checkedIn) {
    const resolved = resolveDepartureClassification({
      status: reservation.status,
      checkInDate: reservation.checkInDate,
      scheduledCheckOutDate: reservation.checkOutDate,
      businessDate: input.businessDate,
      currentTime: input.currentTime,
      policyCheckOutTime: input.policy.checkOutTime,
    });
    if (
      resolved.classification !== "expected_departure" &&
      resolved.classification !== "late_checkout" &&
      resolved.classification !== "overstay"
    ) {
      continue;
    }

    const room =
      roomsByNumber.get(reservation.roomNumber) ??
      input.rooms.find((r) => r.id === reservation.roomId);
    if (!room) continue;

    const hkLabel =
      resolved.classification === "overstay"
        ? "Overstay — cannot clean until checkout"
        : resolved.classification === "late_checkout"
          ? "Late checkout"
          : "Room waiting for checkout";

    departureWatch.push({
      id: `departure_${reservation.id}`,
      roomId: room.id,
      roomNumber: room.room_number,
      roomTypeName: room.room_type.name,
      floorLabel: resolveFloorLabel(room),
      status: "pending_cleaning",
      assignedStaff: "Front desk",
      notes: hkLabel,
      lastGuest: reservation.guestName,
      lastCheckoutTime: "—",
      expectedCompletion: "—",
      departureLabel: hkLabel,
      departureClassification: resolved.classification,
    });
  }

  return {
    tasks,
    stats: computeHousekeepingStats(tasks),
    departureWatch,
  };
}
