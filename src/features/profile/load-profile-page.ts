import { redirect } from "next/navigation";

import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getProfileService } from "@/lib/profile/get-profile-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadProfilePageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session } = await getServiceContextForPage();
  const service = await getProfileService();
  const [profile, activity] = await Promise.all([
    service.getOwnProfile(session),
    service.getOwnActivity(session),
  ]);

  return { profile, activity, session };
}
