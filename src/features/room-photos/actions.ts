"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateDashboardWidgets } from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getRoomPhotoService } from "@/lib/room-photos/get-room-photo-service";
import { ServiceError } from "@/services/types";

export type RoomPhotoActionResult =
  | { success: true }
  | { success: false; error: string };

function toResult(err: unknown): RoomPhotoActionResult {
  return { success: false, error: toSafeActionError(err) };
}

function revalidateRoomPaths(roomNumber: string, roomTypeSlug?: string) {
  revalidatePath("/dashboard/rooms");
  revalidatePath(`/dashboard/rooms/${roomNumber}`);
  if (roomTypeSlug) {
    revalidatePath("/dashboard/rooms/types");
    revalidatePath(`/dashboard/rooms/types/${roomTypeSlug}`);
  }
  revalidateDashboardWidgets();
}

export async function uploadRoomPhotoAction(
  roomNumber: string,
  formData: FormData
): Promise<RoomPhotoActionResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose a photo to upload." };
    }

    const { session, ctx } = await getServiceContext();
    const service = await getRoomPhotoService();
    const buffer = await file.arrayBuffer();
    await service.uploadRoomPhoto(
      ctx,
      session,
      roomNumber,
      file.name,
      buffer,
      file.type
    );

    revalidateRoomPaths(roomNumber);
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toResult(err);
  }
}

export async function uploadRoomTypePhotoAction(
  roomTypeSlug: string,
  formData: FormData
): Promise<RoomPhotoActionResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose a photo to upload." };
    }

    const { session, ctx } = await getServiceContext();
    const service = await getRoomPhotoService();
    const buffer = await file.arrayBuffer();
    await service.uploadRoomTypePhoto(
      ctx,
      session,
      roomTypeSlug,
      file.name,
      buffer,
      file.type
    );

    revalidatePath("/dashboard/rooms/types");
    revalidatePath(`/dashboard/rooms/types/${roomTypeSlug}`);
    revalidatePath("/dashboard/rooms");
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toResult(err);
  }
}

export async function deleteRoomPhotoAction(
  photoId: string,
  roomNumber?: string,
  roomTypeSlug?: string
): Promise<RoomPhotoActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoomPhotoService();
    await service.deletePhoto(ctx, session, photoId);

    if (roomNumber) {
      revalidateRoomPaths(roomNumber, roomTypeSlug);
    } else if (roomTypeSlug) {
      revalidatePath("/dashboard/rooms/types");
      revalidatePath(`/dashboard/rooms/types/${roomTypeSlug}`);
      revalidatePath("/dashboard/rooms");
    }

    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toResult(err);
  }
}

export async function setRoomPhotoCoverAction(
  photoId: string,
  roomNumber?: string,
  roomTypeSlug?: string
): Promise<RoomPhotoActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoomPhotoService();
    await service.setCoverPhoto(ctx, session, photoId);

    if (roomNumber) {
      revalidateRoomPaths(roomNumber, roomTypeSlug);
    } else if (roomTypeSlug) {
      revalidatePath("/dashboard/rooms/types");
      revalidatePath(`/dashboard/rooms/types/${roomTypeSlug}`);
      revalidatePath("/dashboard/rooms");
    }

    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toResult(err);
  }
}

export async function reorderRoomPhotosAction(
  photoIds: string[],
  roomNumber?: string,
  roomTypeSlug?: string
): Promise<RoomPhotoActionResult> {
  try {
    if (photoIds.length === 0) {
      throw new ServiceError("No photos to reorder.", "VALIDATION", 400);
    }

    const { session, ctx } = await getServiceContext();
    const service = await getRoomPhotoService();
    await service.reorderPhotos(ctx, session, photoIds);

    if (roomNumber) {
      revalidateRoomPaths(roomNumber, roomTypeSlug);
    } else if (roomTypeSlug) {
      revalidatePath("/dashboard/rooms/types");
      revalidatePath(`/dashboard/rooms/types/${roomTypeSlug}`);
    }

    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return toResult(err);
  }
}
