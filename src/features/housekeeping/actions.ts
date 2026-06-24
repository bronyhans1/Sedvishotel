"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getHousekeepingService } from "@/lib/housekeeping/get-housekeeping-service";

export type HousekeepingActionResult =
  | { success: true }
  | { success: false; error: string };

function revalidateHousekeeping() {
  revalidatePath("/dashboard/housekeeping");
  revalidatePath("/dashboard/rooms");
  revalidateDashboardWidgets();
}

export async function markCleaningStartedAction(
  roomId: string
): Promise<HousekeepingActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getHousekeepingService();
    await service.markCleaningStarted(ctx, session, roomId);
    revalidateHousekeeping();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function markCleaningCompletedAction(
  roomId: string
): Promise<HousekeepingActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getHousekeepingService();
    await service.markCleaningCompleted(ctx, session, roomId);
    revalidateHousekeeping();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function markRoomReadyAction(
  roomId: string
): Promise<HousekeepingActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getHousekeepingService();
    await service.markRoomReady(ctx, session, roomId);
    revalidateHousekeeping();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function markMaintenanceAction(
  roomId: string
): Promise<HousekeepingActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getHousekeepingService();
    await service.markMaintenance(ctx, session, roomId);
    revalidateHousekeeping();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
