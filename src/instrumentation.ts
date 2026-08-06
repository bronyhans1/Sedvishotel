/**
 * Next.js instrumentation — runs once when the Node.js server process starts.
 * Reconciles legacy reserved rooms for future confirmed reservations against
 * the current Business Date (Reservation Arrival Lifecycle completion).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  try {
    const { ensureArrivalLifecycleReconciled } = await import(
      "@/lib/reservations/ensure-arrival-lifecycle"
    );
    const result = await ensureArrivalLifecycleReconciled();
    if (result) {
      console.info(
        `[arrival-lifecycle] Startup reconcile complete (BD ${result.businessDate}): reserved=${result.reserved}, released=${result.released}`
      );
    }
  } catch (err) {
    console.error("[arrival-lifecycle] Startup reconcile skipped:", err);
  }
}
