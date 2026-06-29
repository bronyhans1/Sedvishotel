import { StorageBuckets } from "@/lib/database/storage";
import { supabaseEnv } from "@/lib/supabase/config";
import type { DbRoomPhoto } from "@/types/database";
import type { RoomPhoto } from "@/types/room-photo";

export function getRoomPhotoPublicUrl(storagePath: string): string {
  const base = supabaseEnv.url.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${StorageBuckets.roomImages}/${storagePath}`;
}

export function mapDbRoomPhotoToRoomPhoto(row: DbRoomPhoto): RoomPhoto {
  return {
    id: row.id,
    url: getRoomPhotoPublicUrl(row.storage_path),
    fileName: row.file_name,
    displayOrder: row.display_order,
    isCover: row.is_cover,
  };
}

export function sanitizePhotoFileName(fileName: string): string {
  const base = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return base.slice(0, 120) || "photo";
}

export function buildUniquePhotoFileName(originalName: string): string {
  const safe = sanitizePhotoFileName(originalName);
  const ext = safe.includes(".") ? safe.slice(safe.lastIndexOf(".")) : "";
  const stem = ext ? safe.slice(0, -ext.length) : safe;
  return `${stem}-${Date.now()}${ext || ".jpg"}`;
}
