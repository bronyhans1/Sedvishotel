import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assembleHousekeepingBoard } from "@/lib/housekeeping/assemble-board";
import { DEFAULT_OVERSTAY_POLICY } from "@/types/overstay";
import type { DbHousekeepingTask, DbRoomWithType } from "@/types/database";

function room(
  id: string,
  number: string,
  status: DbRoomWithType["status"]
): DbRoomWithType {
  return {
    id,
    room_number: number,
    status,
    floor_id: "f1",
    floor: 1,
    room_type_id: "rt1",
    notes: null,
    image_urls: [],
    created_at: "",
    updated_at: "",
    room_type: {
      id: "rt1",
      slug: "standard",
      name: "Standard",
      default_price: 100,
      capacity: 2,
      description: null,
      amenities: [],
      status: "active",
      created_at: "",
      updated_at: "",
    },
    floor_record: {
      id: "f1",
      name: "Floor 1",
      display_order: 1,
      created_at: "",
      updated_at: "",
    },
  } as unknown as DbRoomWithType;
}

const policy = {
  checkOutTime: "12:00",
  lateCheckoutPolicyMode: "flat" as const,
  lateCheckoutFee: 0,
  hourFee1To2: 0,
  hourFee2To4: 0,
  hourFee4To6: 0,
  overstay: { ...DEFAULT_OVERSTAY_POLICY },
};

describe("assembleHousekeepingBoard", () => {
  it("maps board rooms with batched task and checkout enrichment", () => {
    const cleaningTask: DbHousekeepingTask = {
      id: "t1",
      room_id: "r1",
      status: "cleaning",
      assigned_staff_id: null,
      notes: null,
      last_guest_name: null,
      last_checkout_at: null,
      expected_completion: null,
      started_at: "2026-10-18T10:00:00.000Z",
      completed_at: null,
      created_by: null,
      created_at: "",
      updated_at: "",
    };

    const boardRooms = [
      room("r1", "101", "cleaning"),
      room("r2", "102", "available"),
      room("r3", "103", "maintenance"),
    ];
    const rooms = [...boardRooms, room("occ1", "301", "occupied")];

    const result = assembleHousekeepingBoard({
      rooms,
      boardRooms,
      housekeepingTasks: [cleaningTask],
      checkouts: [
        {
          roomId: "r1",
          guestName: "Ada",
          checkoutAt: "2026-10-01T10:00:00.000Z",
        },
      ],
      checkedIn: [],
      businessDate: "2026-10-18",
      currentTime: "10:00",
      policy,
    });

    assert.equal(result.tasks.length, 3);
    assert.equal(result.tasks.find((t) => t.roomId === "r1")?.status, "cleaning");
    assert.equal(result.tasks.find((t) => t.roomId === "r1")?.lastGuest, "Ada");
    assert.equal(result.tasks.find((t) => t.roomId === "r2")?.status, "ready");
    assert.equal(result.tasks.find((t) => t.roomId === "r3")?.status, "maintenance");
    assert.equal(result.stats.currentlyCleaning, 1);
    assert.equal(result.stats.readyRooms, 1);
    assert.equal(result.stats.maintenanceRooms, 1);
  });

  it("preserves departure-watch classifications for checked-in stays", () => {
    const rooms = [room("occ1", "301", "occupied")];
    const result = assembleHousekeepingBoard({
      rooms,
      boardRooms: [],
      housekeepingTasks: [],
      checkouts: [],
      checkedIn: [
        {
          id: "res1",
          status: "checked_in",
          checkInDate: "2026-10-17",
          checkOutDate: "2026-10-18",
          guestName: "In House",
          roomId: "occ1",
          roomNumber: "301",
        },
      ],
      businessDate: "2026-10-18",
      currentTime: "13:00",
      policy,
    });

    assert.equal(result.departureWatch.length, 1);
    assert.equal(result.departureWatch[0]?.lastGuest, "In House");
    assert.ok(
      result.departureWatch[0]?.departureClassification === "expected_departure" ||
        result.departureWatch[0]?.departureClassification === "late_checkout" ||
        result.departureWatch[0]?.departureClassification === "overstay"
    );
  });

  it("handles empty board sets", () => {
    const result = assembleHousekeepingBoard({
      rooms: [room("occ1", "301", "occupied")],
      boardRooms: [],
      housekeepingTasks: [],
      checkouts: [],
      checkedIn: [],
      businessDate: "2026-10-18",
      currentTime: "10:00",
      policy,
    });
    assert.deepEqual(result.tasks, []);
    assert.deepEqual(result.departureWatch, []);
  });
});
