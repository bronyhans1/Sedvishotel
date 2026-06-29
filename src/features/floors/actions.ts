"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getFloorService } from "@/lib/floors/get-floor-service";
import { ServiceError } from "@/services/types";
import type { FloorFormValues } from "@/types/floor";

export type FloorActionResult =
  | { success: true }
  | { success: false; error: string; code?: string };

function toActionResult(err: unknown): FloorActionResult {
  const code = err instanceof ServiceError ? err.code : undefined;
  return {
    success: false,
    error: toSafeActionError(err),
    ...(code ? { code } : {}),
  };
}

function revalidateFloorPaths(id?: string) {
  revalidatePath("/dashboard/floors");
  revalidatePath("/dashboard/rooms");
  revalidatePath("/dashboard/housekeeping");
  revalidateDashboardWidgets();
  if (id) {
    revalidatePath(`/dashboard/floors/${id}`);
  }
}

export async function createFloorAction(
  values: FloorFormValues
): Promise<FloorActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getFloorService();
    const created = await service.createFloor(ctx, session, values);
    revalidateFloorPaths(created.id);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function updateFloorAction(
  id: string,
  values: FloorFormValues
): Promise<FloorActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getFloorService();
    const updated = await service.updateFloor(ctx, session, id, values);
    revalidateFloorPaths(updated.id);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function archiveFloorAction(id: string): Promise<FloorActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getFloorService();
    await service.archiveFloor(ctx, session, id);
    revalidateFloorPaths(id);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function reorderFloorsAction(
  items: { id: string; displayOrder: number }[]
): Promise<FloorActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getFloorService();
    await service.reorderFloors(ctx, session, items);
    revalidateFloorPaths();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}
