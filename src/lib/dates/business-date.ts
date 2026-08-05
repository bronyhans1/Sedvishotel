import { getBusinessDateService } from "@/lib/business-date/get-business-date-service";
import type { HotelOperatingDay } from "@/types/business-date";

/**
 * Operational Business Date (YYYY-MM-DD).
 * Use for front desk, night audit, dashboard day buckets, and daily reports.
 * Do not use for wall-clock timestamps, activity logs, or pricing effective-from.
 */
export async function getCurrentBusinessDate(): Promise<string> {
  const service = await getBusinessDateService();
  return service.getCurrentBusinessDate();
}

/** Full singleton operating-day row for admin / night-audit UI. */
export async function getCurrentOperatingDay(): Promise<HotelOperatingDay> {
  const service = await getBusinessDateService();
  return service.getOperatingDay();
}
