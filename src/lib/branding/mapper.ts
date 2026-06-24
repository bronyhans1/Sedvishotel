import type { DbHotelSettings } from "@/types/database";
import type { BrandingConfig } from "@/lib/branding/types";
import { DEFAULT_BRANDING } from "@/lib/branding/types";

function readJsonString(
  json: Record<string, unknown>,
  key: string,
  fallback: string
): string {
  const value = json[key];
  return typeof value === "string" ? value : fallback;
}

export function mapDbSettingsToBranding(row: DbHotelSettings | null): BrandingConfig {
  if (!row) return DEFAULT_BRANDING;
  const json = row.settings_json ?? {};
  return {
    hotelName: row.hotel_name || DEFAULT_BRANDING.hotelName,
    logoUrl: row.logo_url,
    faviconUrl: readJsonString(json, "faviconUrl", "") || null,
    primaryColor: readJsonString(json, "primaryColor", DEFAULT_BRANDING.primaryColor),
    secondaryColor: readJsonString(json, "secondaryColor", DEFAULT_BRANDING.secondaryColor),
    theme:
      (readJsonString(json, "theme", DEFAULT_BRANDING.theme) as BrandingConfig["theme"]) ||
      "system",
  };
}
