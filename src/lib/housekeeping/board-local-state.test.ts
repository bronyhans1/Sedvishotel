import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyConfirmedBoardTransition,
  assertUniqueRoomIds,
  mergeBoardTasksWithOverrides,
  nextStatusForConfirmedTransition,
  statsFromBoardTasks,
  type BoardStatusOverride,
} from "@/lib/housekeeping/board-local-state";
import type { HousekeepingTask } from "@/types/housekeeping";

function task(
  roomId: string,
  status: HousekeepingTask["status"],
  extras: Partial<HousekeepingTask> = {}
): HousekeepingTask {
  return {
    id: `task_${roomId}`,
    roomId,
    roomNumber: roomId,
    roomTypeName: "Standard",
    floorLabel: "Floor 1",
    status,
    assignedStaff: "Unassigned",
    notes: "",
    lastGuest: "Guest",
    lastCheckoutTime: "—",
    expectedCompletion: "—",
    ...extras,
  };
}

describe("housekeeping board local state", () => {
  it("maps Pending Cleaning → Cleaning on cleaning_started", () => {
    assert.equal(
      nextStatusForConfirmedTransition("pending_cleaning", "cleaning_started"),
      "cleaning"
    );
    const { tasks, override } = applyConfirmedBoardTransition(
      [task("r1", "pending_cleaning")],
      "r1",
      "cleaning_started"
    );
    assert.equal(tasks[0]?.status, "cleaning");
    assert.equal(override?.toStatus, "cleaning");
  });

  it("maps Cleaning → Ready on cleaning_completed and room_ready", () => {
    assert.equal(
      nextStatusForConfirmedTransition("cleaning", "cleaning_completed"),
      "ready"
    );
    assert.equal(nextStatusForConfirmedTransition("cleaning", "room_ready"), "ready");
    const completed = applyConfirmedBoardTransition(
      [task("r1", "cleaning")],
      "r1",
      "cleaning_completed"
    );
    assert.equal(completed.tasks[0]?.status, "ready");
    const ready = applyConfirmedBoardTransition(
      [task("r2", "cleaning")],
      "r2",
      "room_ready"
    );
    assert.equal(ready.tasks[0]?.status, "ready");
  });

  it("maps Maintenance → Ready on room_ready", () => {
    const { tasks } = applyConfirmedBoardTransition(
      [task("r1", "maintenance")],
      "r1",
      "room_ready"
    );
    assert.equal(tasks[0]?.status, "ready");
  });

  it("maps Ready → Maintenance on maintenance", () => {
    const { tasks } = applyConfirmedBoardTransition(
      [task("r1", "ready")],
      "r1",
      "maintenance"
    );
    assert.equal(tasks[0]?.status, "maintenance");
  });

  it("leaves board unchanged when transition is invalid for current status", () => {
    const original = [task("r1", "ready")];
    const { tasks, override } = applyConfirmedBoardTransition(
      original,
      "r1",
      "cleaning_completed"
    );
    assert.equal(override, null);
    assert.equal(tasks[0]?.status, "ready");
  });

  it("does not duplicate cards after a successful local transition", () => {
    const { tasks } = applyConfirmedBoardTransition(
      [task("r1", "cleaning"), task("r2", "ready")],
      "r1",
      "cleaning_completed"
    );
    assert.equal(tasks.length, 2);
    assert.equal(assertUniqueRoomIds(tasks), true);
    assert.equal(tasks.filter((t) => t.roomId === "r1").length, 1);
    assert.equal(tasks.find((t) => t.roomId === "r1")?.status, "ready");
  });

  it("keeps confirmed local status when server props are still stale", () => {
    const override: BoardStatusOverride = {
      roomId: "r1",
      fromStatus: "cleaning",
      toStatus: "ready",
      confirmedAt: Date.now(),
    };
    const merged = mergeBoardTasksWithOverrides(
      [task("r1", "cleaning"), task("r2", "ready")],
      [override]
    );
    assert.equal(merged.tasks.find((t) => t.roomId === "r1")?.status, "ready");
    assert.equal(merged.overrides.length, 1);
  });

  it("clears override when authoritative server props match the transition", () => {
    const override: BoardStatusOverride = {
      roomId: "r1",
      fromStatus: "cleaning",
      toStatus: "ready",
      confirmedAt: Date.now(),
    };
    const merged = mergeBoardTasksWithOverrides(
      [task("r1", "ready")],
      [override]
    );
    assert.equal(merged.tasks[0]?.status, "ready");
    assert.equal(merged.overrides.length, 0);
  });

  it("prefers divergent external server status over local override", () => {
    const override: BoardStatusOverride = {
      roomId: "r1",
      fromStatus: "cleaning",
      toStatus: "ready",
      confirmedAt: Date.now(),
    };
    const merged = mergeBoardTasksWithOverrides(
      [task("r1", "maintenance")],
      [override]
    );
    assert.equal(merged.tasks[0]?.status, "maintenance");
    assert.equal(merged.overrides.length, 0);
  });

  it("recomputes stats from board tasks", () => {
    const stats = statsFromBoardTasks([
      task("a", "pending_cleaning"),
      task("b", "cleaning"),
      task("c", "ready"),
      task("d", "maintenance"),
    ]);
    assert.deepEqual(stats, {
      pendingCleaning: 1,
      currentlyCleaning: 1,
      readyRooms: 1,
      maintenanceRooms: 1,
    });
  });
});
