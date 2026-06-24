import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import {
  SupabaseRoomPhotoRepository,
  SupabaseRoomPhotoStorage,
} from "@/repositories/supabase/room-photo.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { SupabaseRoomTypeRepository } from "@/repositories/supabase/room-type.repository";
import { RoomPhotoService } from "@/services/room-photo.service";

export async function getRoomPhotoService(): Promise<RoomPhotoService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new RoomPhotoService(
    new SupabaseRoomPhotoRepository(client),
    new SupabaseRoomPhotoStorage(client),
    new SupabaseRoomRepository(client),
    new SupabaseRoomTypeRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
