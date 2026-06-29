import { mapDbSettingsToBranding } from "@/lib/branding/mapper";
import { DEFAULT_BRANDING, type BrandingConfig } from "@/lib/branding/types";
import { defaultHotelSettings } from "@/lib/mock-data/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";

/** Load branding for any authenticated or public surface (no settings permission). */
export async function loadBranding(): Promise<BrandingConfig> {
  if (!isSupabaseConfigured()) {
    return {
      hotelName: defaultHotelSettings.hotelName,
      logoUrl: defaultHotelSettings.logoUrl || null,
      faviconUrl: defaultHotelSettings.faviconUrl || null,
      primaryColor: defaultHotelSettings.primaryColor,
      secondaryColor: defaultHotelSettings.secondaryColor,
      theme: defaultHotelSettings.theme,
    };
  }

  try {
    const client = supabaseEnv.serviceRoleKey
      ? createAdminClient()
      : await createServerClient();
    const repo = new SupabaseSettingsRepository(client);
    const row = await repo.getActive();
    return mapDbSettingsToBranding(row);
  } catch {
    return DEFAULT_BRANDING;
  }
}
