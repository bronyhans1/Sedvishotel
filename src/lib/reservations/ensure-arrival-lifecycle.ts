import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AuthSession } from "@/services/auth.service";
import type { ServiceContext } from "@/services/types";

/** Synthetic context for startup / process-level arrival lifecycle reconciliation. */
export const ARRIVAL_LIFECYCLE_SYSTEM_CONTEXT: ServiceContext = {
  userId: "",
  roleId: "admin",
};

export const ARRIVAL_LIFECYCLE_SYSTEM_SESSION: AuthSession = {
  userId: "",
  email: "system@sedvis.local",
  fullName: "SHMS Arrival Lifecycle",
  roleId: "admin",
  permissions: [],
  mustChangePassword: false,
};

let reconcileOnce: Promise<{
  reserved: number;
  released: number;
  businessDate: string;
} | null> | null = null;

/**
 * Idempotent process-level reconcile of physical room status against the
 * Reservation Arrival Lifecycle and current Business Date.
 * Safe to call from instrumentation, Walk-In availability, or repeatedly.
 */
export async function ensureArrivalLifecycleReconciled(options?: {
  force?: boolean;
}): Promise<{
  reserved: number;
  released: number;
  businessDate: string;
} | null> {
  if (!isSupabaseConfigured()) return null;

  if (!options?.force && reconcileOnce) {
    return reconcileOnce;
  }

  const run = (async () => {
    try {
      const { getReservationService } = await import(
        "@/lib/reservations/get-reservation-service"
      );
      const service = await getReservationService();
      const businessDate = await getCurrentBusinessDate();
      const result = await service.syncArrivalRoomStatusesForBusinessDate(
        ARRIVAL_LIFECYCLE_SYSTEM_CONTEXT,
        ARRIVAL_LIFECYCLE_SYSTEM_SESSION,
        businessDate,
        options?.force ? "forced_reconcile" : "startup_or_lazy_reconcile"
      );
      return { ...result, businessDate };
    } catch (err) {
      console.error(
        "[arrival-lifecycle] Failed to reconcile room statuses against Business Date:",
        err
      );
      reconcileOnce = null;
      return null;
    }
  })();

  if (!options?.force) {
    reconcileOnce = run;
  }

  return run;
}
