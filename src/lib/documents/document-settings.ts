import type { HotelSettings } from "@/types/settings";

export type DocumentSettings = HotelSettings;

export function mapHotelSettingsToDocumentSettings(
  settings: HotelSettings
): DocumentSettings {
  return settings;
}
