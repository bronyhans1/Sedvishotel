"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getRoomService } from "@/lib/rooms/get-room-service";
import { ServiceError } from "@/services/types";
import type { DbRoomStatus } from "@/types/database";
import type { RoomFormValues } from "@/types/room";

export type RoomActionResult =
  | { success: true }
  | { success: false; error: string; code?: string };

function toActionResult(err: unknown): RoomActionResult {
  const code = err instanceof ServiceError ? err.code : undefined;
  return {
    success: false,
    error: toSafeActionError(err),
    ...(code ? { code } : {}),
  };
}

function revalidateFloorPaths(...floorIds: (string | undefined)[]) {
  revalidatePath("/dashboard/floors");
  for (const floorId of new Set(floorIds.filter(Boolean))) {
    revalidatePath(`/dashboard/floors/${floorId}`);
  }
}

function revalidateRoomTypePaths(...typeIds: (string | undefined)[]) {
  revalidatePath("/dashboard/rooms/types");
  for (const typeId of new Set(typeIds.filter(Boolean))) {
    revalidatePath(`/dashboard/rooms/types/${typeId}`);
  }
}

export async function createRoomAction(
  values: RoomFormValues
): Promise<RoomActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoomService();
    const created = await service.create(ctx, session, values);
    revalidatePath("/dashboard/rooms");
    revalidatePath(`/dashboard/rooms/${created.roomNumber}`);
    revalidatePath("/dashboard/housekeeping");
    revalidateRoomTypePaths(created.roomTypeId);
    revalidateFloorPaths(created.floorId);
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function updateRoomAction(
  idOrNumber: string,
  values: RoomFormValues
): Promise<RoomActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoomService();
    const existing = await service.getById(ctx, session, idOrNumber);
    const updated = await service.update(ctx, session, idOrNumber, values);
    revalidatePath("/dashboard/rooms");
    revalidatePath(`/dashboard/rooms/${updated.roomNumber}`);
    revalidatePath("/dashboard/housekeeping");
    revalidateRoomTypePaths(existing?.roomTypeId, updated.roomTypeId);
    revalidateFloorPaths(existing?.floorId, updated.floorId);
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function changeRoomStatusAction(
  idOrNumber: string,
  status: DbRoomStatus
): Promise<RoomActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoomService();
    const updated = await service.changeStatus(ctx, session, idOrNumber, status);
    revalidatePath("/dashboard/rooms");
    revalidatePath(`/dashboard/rooms/${updated.roomNumber}`);
    revalidatePath("/dashboard/housekeeping");
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function archiveRoomAction(
  idOrNumber: string
): Promise<RoomActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoomService();
    const existing = await service.getById(ctx, session, idOrNumber);
    await service.archive(ctx, session, idOrNumber);
    revalidatePath("/dashboard/rooms");
    revalidatePath(`/dashboard/rooms/${idOrNumber}`);
    revalidateRoomTypePaths(existing?.roomTypeId);
    revalidateFloorPaths(existing?.floorId);
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function deleteRoomAction(
  idOrNumber: string
): Promise<RoomActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoomService();
    const existing = await service.getById(ctx, session, idOrNumber);
    await service.delete(ctx, session, idOrNumber);
    revalidatePath("/dashboard/rooms");
    revalidatePath(`/dashboard/rooms/${idOrNumber}`);
    revalidateRoomTypePaths(existing?.roomTypeId);
    revalidateFloorPaths(existing?.floorId);
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function getRoomDeleteBlockersAction(
  idOrNumber: string
): Promise<{ blockers: string[] }> {
  const { session, ctx } = await getServiceContext();
  const service = await getRoomService();
  const blockers = await service.getDeleteBlockers(ctx, session, idOrNumber);
  return { blockers };
}
