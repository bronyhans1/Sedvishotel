import { StorageBuckets } from "@/lib/database/storage";
import type {
  IRoomPhotoRepository,
  IRoomPhotoStorage,
} from "@/repositories/room-photo.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbRoomPhoto } from "@/types/database";

export class SupabaseRoomPhotoRepository implements IRoomPhotoRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async listRoomPhotos(roomId: string): Promise<DbRoomPhoto[]> {
    const { data, error } = await this.client
      .from("room_photos")
      .select("*")
      .eq("room_id", roomId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list room photos: ${error.message}`);
    }

    return (data ?? []) as DbRoomPhoto[];
  }

  async listRoomTypePhotos(roomTypeId: string): Promise<DbRoomPhoto[]> {
    const { data, error } = await this.client
      .from("room_photos")
      .select("*")
      .eq("room_type_id", roomTypeId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list room type photos: ${error.message}`);
    }

    return (data ?? []) as DbRoomPhoto[];
  }

  async getById(id: string): Promise<DbRoomPhoto | null> {
    const { data, error } = await this.client
      .from("room_photos")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load room photo: ${error.message}`);
    }

    return (data ?? null) as DbRoomPhoto | null;
  }

  async create(
    data: Omit<DbRoomPhoto, "id" | "created_at" | "updated_at">
  ): Promise<DbRoomPhoto> {
    const { data: row, error } = await this.client
      .from("room_photos")
      .insert(data)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create room photo: ${error.message}`);
    }

    return row as DbRoomPhoto;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("room_photos").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete room photo: ${error.message}`);
    }
  }

  async clearCoverForEntity(
    roomId: string | null,
    roomTypeId: string | null
  ): Promise<void> {
    let query = this.client.from("room_photos").update({ is_cover: false });
    if (roomId) {
      query = query.eq("room_id", roomId);
    } else if (roomTypeId) {
      query = query.eq("room_type_id", roomTypeId);
    } else {
      return;
    }

    const { error } = await query;
    if (error) {
      throw new Error(`Failed to clear cover photo: ${error.message}`);
    }
  }

  async setCover(
    id: string,
    roomId: string | null,
    roomTypeId: string | null
  ): Promise<DbRoomPhoto> {
    await this.clearCoverForEntity(roomId, roomTypeId);

    const { data, error } = await this.client
      .from("room_photos")
      .update({ is_cover: true })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to set cover photo: ${error.message}`);
    }

    return data as DbRoomPhoto;
  }

  async updateDisplayOrders(
    updates: { id: string; displayOrder: number }[]
  ): Promise<void> {
    for (const item of updates) {
      const { error } = await this.client
        .from("room_photos")
        .update({ display_order: item.displayOrder })
        .eq("id", item.id);

      if (error) {
        throw new Error(`Failed to reorder photos: ${error.message}`);
      }
    }
  }
}

export class SupabaseRoomPhotoStorage implements IRoomPhotoStorage {
  constructor(private readonly client: SupabaseServerClient) {}

  async upload(path: string, buffer: ArrayBuffer, contentType: string): Promise<void> {
    const { error } = await this.client.storage
      .from(StorageBuckets.roomImages)
      .upload(path, buffer, { upsert: false, contentType });

    if (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }
  }

  async remove(path: string): Promise<void> {
    const { error } = await this.client.storage
      .from(StorageBuckets.roomImages)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to remove photo from storage: ${error.message}`);
    }
  }
}
