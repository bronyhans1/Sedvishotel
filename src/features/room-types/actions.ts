"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getRoomTypeAccess } from "@/lib/auth/room-type-access";
import { getServiceContext } from "@/lib/auth/service-context";
import { getRoomTypeService } from "@/lib/room-types/get-room-type-service";
import { ServiceError } from "@/services/types";
import type { RoomTypeFormValues } from "@/types/room-type";

export type RoomTypeActionResult =
  | { success: true }
  | { success: false; error: string; code?: string };

function toActionResult(err: unknown): RoomTypeActionResult {
  const code = err instanceof ServiceError ? err.code : undefined;
  return {
    success: false,
    error: toSafeActionError(err),
    ...(code ? { code } : {}),
  };
}

export async function createRoomTypeAction(
  values: RoomTypeFormValues
): Promise<RoomTypeActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoomTypeService();
    const created = await service.create(ctx, session, values);
    revalidatePath("/dashboard/rooms/types");
    revalidatePath(`/dashboard/rooms/types/${created.id}`);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function updateRoomTypeAction(
  idOrSlug: string,
  values: RoomTypeFormValues
): Promise<RoomTypeActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoomTypeService();
    const updated = await service.update(ctx, session, idOrSlug, values);
    revalidatePath("/dashboard/rooms/types");
    revalidatePath(`/dashboard/rooms/types/${updated.id}`);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function archiveRoomTypeAction(
  idOrSlug: string
): Promise<RoomTypeActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoomTypeService();
    const archived = await service.archive(ctx, session, idOrSlug);
    revalidatePath("/dashboard/rooms/types");
    revalidatePath(`/dashboard/rooms/types/${archived.id}`);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function deleteRoomTypeAction(
  idOrSlug: string
): Promise<RoomTypeActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoomTypeService();
    await service.delete(ctx, session, idOrSlug);
    revalidatePath("/dashboard/rooms/types");
    revalidatePath(`/dashboard/rooms/types/${idOrSlug}`);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function getRoomTypeDeleteBlockersAction(
  idOrSlug: string
): Promise<{ blockers: string[] }> {
  const { session, ctx } = await getServiceContext();
  const service = await getRoomTypeService();
  const blockers = await service.getDeleteBlockers(ctx, session, idOrSlug);
  return { blockers };
}

export async function getRoomTypeAccessAction() {
  const { session } = await getServiceContext();
  return getRoomTypeAccess(session);
}
