import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/**
 * Structural contract tests for the housekeeping listTasks data path.
 * Runtime N+1 avoidance is covered by assemble-board + repository batch tests;
 * this file locks the service wiring so regressions reintroduce getAll / per-room loops.
 */
describe("HousekeepingService.listTasks lean wiring", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/services/housekeeping.service.ts"),
    "utf8"
  );

  it("does not call reservations.getAll in listTasks", () => {
    const listTasksBody = source.slice(
      source.indexOf("async listTasks("),
      source.indexOf("async markCleaningStarted(")
    );
    assert.equal(listTasksBody.includes("this.reservations.getAll("), false);
    assert.equal(
      listTasksBody.includes("listCheckedInForHousekeeping("),
      true
    );
    assert.equal(
      listTasksBody.includes("listLatestCheckoutsForHousekeeping("),
      true
    );
  });

  it("batch-loads housekeeping tasks instead of per-room findByRoomId loops", () => {
    const listTasksBody = source.slice(
      source.indexOf("async listTasks("),
      source.indexOf("async markCleaningStarted(")
    );
    assert.equal(listTasksBody.includes("findLatestByRoomIds("), true);
    assert.equal(listTasksBody.includes("findByRoomId("), false);
    assert.equal(listTasksBody.includes("getByRoomId("), false);
    assert.equal(listTasksBody.includes("assembleHousekeepingBoard("), true);
  });
});
