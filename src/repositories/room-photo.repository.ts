import type { DbRoomPhoto } from "@/types/database";

export interface IRoomPhotoRepository {
  listRoomPhotos(roomId: string): Promise<DbRoomPhoto[]>;
  listRoomTypePhotos(roomTypeId: string): Promise<DbRoomPhoto[]>;
  getById(id: string): Promise<DbRoomPhoto | null>;
  create(
    data: Omit<DbRoomPhoto, "id" | "created_at" | "updated_at">
  ): Promise<DbRoomPhoto>;
  delete(id: string): Promise<void>;
  setCover(id: string, roomId: string | null, roomTypeId: string | null): Promise<DbRoomPhoto>;
  updateDisplayOrders(updates: { id: string; displayOrder: number }[]): Promise<void>;
  clearCoverForEntity(roomId: string | null, roomTypeId: string | null): Promise<void>;
}

export interface IRoomPhotoStorage {
  upload(path: string, buffer: ArrayBuffer, contentType: string): Promise<void>;
  remove(path: string): Promise<void>;
}
