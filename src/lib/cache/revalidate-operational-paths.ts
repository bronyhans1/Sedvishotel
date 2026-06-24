import { revalidatePath } from "next/cache";

/** Dashboard home widgets: occupancy, revenue, active stays, recent activity. */
export function revalidateDashboardWidgets() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/revenue");
}
