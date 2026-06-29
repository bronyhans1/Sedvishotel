import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseRoomTypeRepository } from "@/repositories/supabase/room-type.repository";

import { buildPublicRoomsFromRoomTypes } from "@/lib/public/public-room-catalog";

export {
  buildPublicRoomsFromRoomTypes,
  FEATURED_PUBLIC_CATEGORIES,
  getFeaturedPublicRooms,
  getPublicRoomBySlug,
  getRelatedRooms,
} from "@/lib/public/public-room-catalog";

export async function loadPublicRooms() {
  try {
    const client = supabaseEnv.serviceRoleKey
      ? createAdminClient()
      : await createServerClient();
    const repo = new SupabaseRoomTypeRepository(client);
    const types = await repo.getAll(false);
    return buildPublicRoomsFromRoomTypes(types);
  } catch {
    return [];
  }
}
