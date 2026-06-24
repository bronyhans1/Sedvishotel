import { revalidatePath } from "next/cache";

import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";

/** Refresh dashboard widgets and finance/operations pages after state changes. */
export function revalidateOperationalFinancePaths(opts?: {
  nightAuditRef?: string;
}) {
  revalidateDashboardWidgets();
  revalidatePath("/dashboard/night-audit");
  revalidatePath("/dashboard/shift-handover");
  if (opts?.nightAuditRef) {
    revalidatePath(`/dashboard/night-audit/${opts.nightAuditRef}`);
  }
}
