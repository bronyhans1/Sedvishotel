import { revalidatePath } from "next/cache";

export function revalidateGroupReservationPaths(groupId?: string) {
  revalidatePath("/dashboard/group-reservations");
  if (groupId) {
    revalidatePath(`/dashboard/group-reservations/${groupId}`);
  }
  revalidatePath("/dashboard/corporate-accounts");
  revalidateDashboardWidgets();
}

/** Dashboard home widgets: occupancy, revenue, active stays, recent activity. */
export function revalidateDashboardWidgets() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/revenue");
  revalidatePath("/dashboard/reports");
}
