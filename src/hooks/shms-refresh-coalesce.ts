/**
 * Coalesces Realtime-driven router.refresh with an explicit local mutation refresh.
 * Local mutations already call useLiveRefresh(); rooms/notifications Realtime echoes
 * would otherwise schedule a second overlapping refresh that can race with stale RSC.
 *
 * External updates that arrive during the suppress window are not dropped forever:
 * a single trailing refresh runs after the window if any Realtime events were skipped.
 */

const SUPPRESS_MS = 1200;

type CoalesceState = {
  suppressUntil: number;
  skippedDuringSuppress: boolean;
  trailingTimer: ReturnType<typeof setTimeout> | null;
  trailingCallback: (() => void) | null;
};

const state: CoalesceState = {
  suppressUntil: 0,
  skippedDuringSuppress: false,
  trailingTimer: null,
  trailingCallback: null,
};

export function markLocalMutationRefresh(): void {
  state.suppressUntil = Date.now() + SUPPRESS_MS;
  state.skippedDuringSuppress = false;
  if (state.trailingTimer !== null) {
    clearTimeout(state.trailingTimer);
    state.trailingTimer = null;
  }
}

export function shouldSkipRealtimeRefreshNow(): boolean {
  return Date.now() < state.suppressUntil;
}

/**
 * @returns true if the Realtime-triggered refresh should be skipped (local mutation echo).
 * Schedules at most one trailing refresh after the suppress window when events were skipped.
 */
export function noteRealtimeRefreshAttempt(runRefresh: () => void): boolean {
  if (!shouldSkipRealtimeRefreshNow()) {
    return false;
  }

  state.skippedDuringSuppress = true;
  state.trailingCallback = runRefresh;

  if (state.trailingTimer === null) {
    const wait = Math.max(state.suppressUntil - Date.now() + 25, 25);
    state.trailingTimer = setTimeout(() => {
      state.trailingTimer = null;
      const cb = state.trailingCallback;
      state.trailingCallback = null;
      if (state.skippedDuringSuppress && cb) {
        state.skippedDuringSuppress = false;
        cb();
      }
    }, wait);
  }

  return true;
}

/** Test / cleanup helper — not used in production UI. */
export function resetRefreshCoalesceForTests(): void {
  if (state.trailingTimer !== null) {
    clearTimeout(state.trailingTimer);
  }
  state.suppressUntil = 0;
  state.skippedDuringSuppress = false;
  state.trailingTimer = null;
  state.trailingCallback = null;
}
