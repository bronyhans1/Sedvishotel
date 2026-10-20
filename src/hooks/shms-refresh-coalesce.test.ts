import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  markLocalMutationRefresh,
  noteRealtimeRefreshAttempt,
  resetRefreshCoalesceForTests,
  shouldSkipRealtimeRefreshNow,
} from "@/hooks/shms-refresh-coalesce";

describe("shms refresh coalesce", () => {
  it("suppresses realtime refresh immediately after a local mutation", () => {
    resetRefreshCoalesceForTests();
    markLocalMutationRefresh();
    assert.equal(shouldSkipRealtimeRefreshNow(), true);

    let trailingCalls = 0;
    const skipped = noteRealtimeRefreshAttempt(() => {
      trailingCalls += 1;
    });
    assert.equal(skipped, true);
    assert.equal(trailingCalls, 0);
    resetRefreshCoalesceForTests();
  });

  it("does not skip realtime refresh when no local mutation is pending", () => {
    resetRefreshCoalesceForTests();
    assert.equal(shouldSkipRealtimeRefreshNow(), false);
    let calls = 0;
    const skipped = noteRealtimeRefreshAttempt(() => {
      calls += 1;
    });
    assert.equal(skipped, false);
    assert.equal(calls, 0);
  });
});
