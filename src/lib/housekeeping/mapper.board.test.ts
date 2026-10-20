import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapRoomToHousekeepingTask } from "@/lib/housekeeping/mapper";
import type { DbHousekeepingTask, DbRoomWithType } from "@/types/database";

function room(status: DbRoomWithType["status"]): DbRoomWithType {
  return {
    id: "r1",
    room_number: "101",
    status,
    floor_id: "f1",
    floor: 1,
    room_type_id: "rt1",
    notes: null,
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

describe("mapRoomToHousekeepingTask status semantics", () => {
  it("keeps pending vs cleaning distinction from task fields", () => {
    const pending = mapRoomToHousekeepingTask(room("cleaning"), null);
    assert.equal(pending?.status, "pending_cleaning");

    const started: DbHousekeepingTask = {
      id: "t1",
      room_id: "r1",
      status: "cleaning",
      assigned_staff_id: "u1",
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
    const cleaning = mapRoomToHousekeepingTask(room("cleaning"), started);
    assert.equal(cleaning?.status, "cleaning");
  });

  it("maps available rooms to ready and preserves last checkout display inputs", () => {
    const mapped = mapRoomToHousekeepingTask(
      room("available"),
      null,
      "Ada Lovelace",
      "2026-10-01T10:00:00.000Z"
    );
    assert.equal(mapped?.status, "ready");
    assert.equal(mapped?.lastGuest, "Ada Lovelace");
    assert.match(mapped?.lastCheckoutTime ?? "", /2026/);
  });
});
