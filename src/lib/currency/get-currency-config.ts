import { cache } from "react";

import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getSettingsService } from "@/lib/settings/get-settings-service";

import { buildCurrencyConfigFromSettings } from "./format";
import { DEFAULT_CURRENCY_CONFIG, type CurrencyFormatConfig } from "./types";

export const getCurrencyConfig = cache(
  async (): Promise<CurrencyFormatConfig> => {
    try {
      const { session, ctx } = await getServiceContextForPage();
      const settingsService = await getSettingsService();
      const settings = await settingsService.getHotelSettings(ctx, session);
      return buildCurrencyConfigFromSettings(settings);
    } catch {
      return DEFAULT_CURRENCY_CONFIG;
    }
  }
);
