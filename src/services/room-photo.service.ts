import { sessionHasPermission } from "@/lib/auth/permissions";
import {
  ROOM_PHOTO_ALLOWED_TYPES,
  ROOM_PHOTO_MAX_BYTES,
  ROOM_PHOTO_MAX_COUNT,
  ROOM_TYPE_PHOTO_MAX_COUNT,
} from "@/lib/room-photos/constants";
import {
  buildUniquePhotoFileName,
  mapDbRoomPhotoToRoomPhoto,
} from "@/lib/room-photos/mapper";
import { StoragePaths } from "@/lib/database/storage";
import type { IRoomPhotoRepository, IRoomPhotoStorage } from "@/repositories/room-photo.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { IRoomTypeRepository } from "@/repositories/room-type.repository";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { RoomPhoto, RoomPhotoGallery } from "@/types/room-photo";

export interface IRoomPhotoService {
  getDisplayPhotos(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string,
    roomTypeId: string
  ): Promise<RoomPhotoGallery>;
  listRoomPhotos(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string
  ): Promise<RoomPhoto[]>;
  listRoomTypePhotos(
    ctx: ServiceContext,
    session: AuthSession,
    roomTypeId: string
  ): Promise<RoomPhoto[]>;
  uploadRoomPhoto(
    ctx: ServiceContext,
    session: AuthSession,
    roomNumber: string,
    fileName: string,
    fileBuffer: ArrayBuffer,
    contentType: string
  ): Promise<RoomPhoto>;
  uploadRoomTypePhoto(
    ctx: ServiceContext,
    session: AuthSession,
    roomTypeSlug: string,
    fileName: string,
    fileBuffer: ArrayBuffer,
    contentType: string
  ): Promise<RoomPhoto>;
  deletePhoto(ctx: ServiceContext, session: AuthSession, photoId: string): Promise<void>;
  setCoverPhoto(
    ctx: ServiceContext,
    session: AuthSession,
    photoId: string
  ): Promise<RoomPhoto>;
  reorderPhotos(
    ctx: ServiceContext,
    session: AuthSession,
    photoIds: string[]
  ): Promise<RoomPhoto[]>;
}

export class RoomPhotoService implements IRoomPhotoService {
  constructor(
    private readonly photos: IRoomPhotoRepository,
    private readonly storage: IRoomPhotoStorage,
    private readonly rooms: IRoomRepository,
    private readonly roomTypes: IRoomTypeRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private requireRoom(session: AuthSession, action: "view" | "edit"): void {
    if (!sessionHasPermission(session, "rooms", action)) {
      throw new ServiceError(
        `Forbidden: missing permission rooms.${action}`,
        "FORBIDDEN",
        403
      );
    }
    if (action === "edit" && session.roleId === "housekeeping") {
      throw new ServiceError("Forbidden: housekeeping cannot edit rooms.", "FORBIDDEN", 403);
    }
  }

  private requireRoomType(session: AuthSession, action: "view" | "edit"): void {
    if (!sessionHasPermission(session, "room_types", action)) {
      throw new ServiceError(
        `Forbidden: missing permission room_types.${action}`,
        "FORBIDDEN",
        403
      );
    }
  }

  private validateFile(fileName: string, fileBuffer: ArrayBuffer, contentType: string): void {
    if (!fileName.trim()) {
      throw new ServiceError("File name is required.", "VALIDATION", 400);
    }
    if (!ROOM_PHOTO_ALLOWED_TYPES.has(contentType)) {
      throw new ServiceError("Use JPEG, PNG, or WebP images only.", "VALIDATION", 400);
    }
    if (fileBuffer.byteLength === 0) {
      throw new ServiceError("File is empty.", "VALIDATION", 400);
    }
    if (fileBuffer.byteLength > ROOM_PHOTO_MAX_BYTES) {
      throw new ServiceError("Image must be 5 MB or smaller.", "VALIDATION", 400);
    }
  }

  private async log(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      module: "rooms" | "room_types";
      entityType: "room" | "room_type";
      entityId: string;
      action: string;
      actionCode: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: input.module,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  async getDisplayPhotos(
    _ctx: ServiceContext,
    session: AuthSession,
    roomId: string,
    roomTypeId: string
  ): Promise<RoomPhotoGallery> {
    this.requireRoom(session, "view");

    const roomRows = await this.photos.listRoomPhotos(roomId);
    if (roomRows.length > 0) {
      return {
        photos: roomRows.map(mapDbRoomPhotoToRoomPhoto),
        source: "room",
        inheritedFromRoomType: false,
      };
    }

    const typeRows = await this.photos.listRoomTypePhotos(roomTypeId);
    if (typeRows.length > 0) {
      return {
        photos: typeRows.map(mapDbRoomPhotoToRoomPhoto),
        source: "room_type",
        inheritedFromRoomType: true,
      };
    }

    return { photos: [], source: "none", inheritedFromRoomType: false };
  }

  async listRoomPhotos(
    _ctx: ServiceContext,
    session: AuthSession,
    roomId: string
  ): Promise<RoomPhoto[]> {
    this.requireRoom(session, "view");
    const rows = await this.photos.listRoomPhotos(roomId);
    return rows.map(mapDbRoomPhotoToRoomPhoto);
  }

  async listRoomTypePhotos(
    _ctx: ServiceContext,
    session: AuthSession,
    roomTypeId: string
  ): Promise<RoomPhoto[]> {
    this.requireRoomType(session, "view");
    const rows = await this.photos.listRoomTypePhotos(roomTypeId);
    return rows.map(mapDbRoomPhotoToRoomPhoto);
  }

  async uploadRoomPhoto(
    ctx: ServiceContext,
    session: AuthSession,
    roomNumber: string,
    fileName: string,
    fileBuffer: ArrayBuffer,
    contentType: string
  ): Promise<RoomPhoto> {
    this.requireRoom(session, "edit");
    this.validateFile(fileName, fileBuffer, contentType);

    const room = await this.rooms.getByNumber(roomNumber);
    if (!room) {
      throw new ServiceError("Room not found.", "NOT_FOUND", 404);
    }

    const existing = await this.photos.listRoomPhotos(room.id);
    if (existing.length >= ROOM_PHOTO_MAX_COUNT) {
      throw new ServiceError(
        `Maximum ${ROOM_PHOTO_MAX_COUNT} photos per room.`,
        "VALIDATION",
        400
      );
    }

    const uniqueName = buildUniquePhotoFileName(fileName);
    const storagePath = StoragePaths.roomImage(room.room_number, uniqueName);
    await this.storage.upload(storagePath, fileBuffer, contentType);

    const isFirst = existing.length === 0;
    const hasCover = existing.some((p) => p.is_cover);

    try {
      const row = await this.photos.create({
        room_id: room.id,
        room_type_id: null,
        storage_path: storagePath,
        file_name: fileName,
        display_order: existing.length + 1,
        is_cover: isFirst || !hasCover,
      });

      await this.log(ctx, session, {
        module: "rooms",
        entityType: "room",
        entityId: room.id,
        action: "Uploaded room photo",
        actionCode: ActivityActionCodes.ROOM_PHOTO_UPLOADED,
        metadata: { room_id: room.id, file_name: fileName },
      });

      return mapDbRoomPhotoToRoomPhoto(row);
    } catch (err) {
      await this.storage.remove(storagePath).catch(() => undefined);
      throw err;
    }
  }

  async uploadRoomTypePhoto(
    ctx: ServiceContext,
    session: AuthSession,
    roomTypeSlug: string,
    fileName: string,
    fileBuffer: ArrayBuffer,
    contentType: string
  ): Promise<RoomPhoto> {
    this.requireRoomType(session, "edit");
    this.validateFile(fileName, fileBuffer, contentType);

    const roomType = await this.roomTypes.getById(roomTypeSlug);
    if (!roomType) {
      throw new ServiceError("Room type not found.", "NOT_FOUND", 404);
    }

    const existing = await this.photos.listRoomTypePhotos(roomType.id);
    if (existing.length >= ROOM_TYPE_PHOTO_MAX_COUNT) {
      throw new ServiceError(
        `Maximum ${ROOM_TYPE_PHOTO_MAX_COUNT} photos per room type.`,
        "VALIDATION",
        400
      );
    }

    const uniqueName = buildUniquePhotoFileName(fileName);
    const storagePath = StoragePaths.roomTypeImage(roomType.slug, uniqueName);
    await this.storage.upload(storagePath, fileBuffer, contentType);

    const isFirst = existing.length === 0;
    const hasCover = existing.some((p) => p.is_cover);

    try {
      const row = await this.photos.create({
        room_id: null,
        room_type_id: roomType.id,
        storage_path: storagePath,
        file_name: fileName,
        display_order: existing.length + 1,
        is_cover: isFirst || !hasCover,
      });

      await this.log(ctx, session, {
        module: "room_types",
        entityType: "room_type",
        entityId: roomType.id,
        action: "Uploaded room type photo",
        actionCode: ActivityActionCodes.ROOM_TYPE_PHOTO_UPLOADED,
        metadata: { room_type_id: roomType.id, file_name: fileName },
      });

      return mapDbRoomPhotoToRoomPhoto(row);
    } catch (err) {
      await this.storage.remove(storagePath).catch(() => undefined);
      throw err;
    }
  }

  async deletePhoto(
    ctx: ServiceContext,
    session: AuthSession,
    photoId: string
  ): Promise<void> {
    const row = await this.photos.getById(photoId);
    if (!row) {
      throw new ServiceError("Photo not found.", "NOT_FOUND", 404);
    }

    if (row.room_id) {
      this.requireRoom(session, "edit");
    } else if (row.room_type_id) {
      this.requireRoomType(session, "edit");
    }

    const wasCover = row.is_cover;
    const roomId = row.room_id;
    const roomTypeId = row.room_type_id;

    await this.storage.remove(row.storage_path);
    await this.photos.delete(photoId);

    if (wasCover) {
      const remaining = roomId
        ? await this.photos.listRoomPhotos(roomId)
        : roomTypeId
          ? await this.photos.listRoomTypePhotos(roomTypeId)
          : [];

      if (remaining.length > 0) {
        await this.photos.setCover(remaining[0].id, roomId, roomTypeId);
      }
    }

    if (roomId) {
      await this.log(ctx, session, {
        module: "rooms",
        entityType: "room",
        entityId: roomId,
        action: "Deleted room photo",
        actionCode: ActivityActionCodes.ROOM_PHOTO_DELETED,
        metadata: { room_id: roomId, file_name: row.file_name },
      });
    } else if (roomTypeId) {
      await this.log(ctx, session, {
        module: "room_types",
        entityType: "room_type",
        entityId: roomTypeId,
        action: "Deleted room type photo",
        actionCode: ActivityActionCodes.ROOM_TYPE_PHOTO_DELETED,
        metadata: { room_type_id: roomTypeId, file_name: row.file_name },
      });
    }
  }

  async setCoverPhoto(
    ctx: ServiceContext,
    session: AuthSession,
    photoId: string
  ): Promise<RoomPhoto> {
    const row = await this.photos.getById(photoId);
    if (!row) {
      throw new ServiceError("Photo not found.", "NOT_FOUND", 404);
    }

    if (row.room_id) {
      this.requireRoom(session, "edit");
    } else if (row.room_type_id) {
      this.requireRoomType(session, "edit");
    }

    const updated = await this.photos.setCover(
      photoId,
      row.room_id,
      row.room_type_id
    );

    if (row.room_id) {
      await this.log(ctx, session, {
        module: "rooms",
        entityType: "room",
        entityId: row.room_id,
        action: "Changed room cover photo",
        actionCode: ActivityActionCodes.ROOM_PHOTO_COVER_CHANGED,
        metadata: { room_id: row.room_id, file_name: row.file_name },
      });
    } else if (row.room_type_id) {
      await this.log(ctx, session, {
        module: "room_types",
        entityType: "room_type",
        entityId: row.room_type_id,
        action: "Changed room type cover photo",
        actionCode: ActivityActionCodes.ROOM_TYPE_PHOTO_COVER_CHANGED,
        metadata: { room_type_id: row.room_type_id, file_name: row.file_name },
      });
    }

    return mapDbRoomPhotoToRoomPhoto(updated);
  }

  async reorderPhotos(
    ctx: ServiceContext,
    session: AuthSession,
    photoIds: string[]
  ): Promise<RoomPhoto[]> {
    if (photoIds.length === 0) return [];

    const first = await this.photos.getById(photoIds[0]);
    if (!first) {
      throw new ServiceError("Photo not found.", "NOT_FOUND", 404);
    }

    if (first.room_id) {
      this.requireRoom(session, "edit");
    } else if (first.room_type_id) {
      this.requireRoomType(session, "edit");
    }

    const updates = photoIds.map((id, index) => ({
      id,
      displayOrder: index + 1,
    }));
    await this.photos.updateDisplayOrders(updates);

    if (first.room_id) {
      const rows = await this.photos.listRoomPhotos(first.room_id);
      return rows.map(mapDbRoomPhotoToRoomPhoto);
    }

    if (first.room_type_id) {
      const rows = await this.photos.listRoomTypePhotos(first.room_type_id);
      return rows.map(mapDbRoomPhotoToRoomPhoto);
    }

    return [];
  }
}
