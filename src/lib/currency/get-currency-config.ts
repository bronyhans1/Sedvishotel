import { cache } from "react";

import { getDocumentConfigService } from "@/lib/documents/get-document-config-service";

import { buildCurrencyConfigFromSettings } from "./format";
import { DEFAULT_CURRENCY_CONFIG, type CurrencyFormatConfig } from "./types";

export const getCurrencyConfig = cache(
  async (): Promise<CurrencyFormatConfig> => {
    try {
      const service = await getDocumentConfigService();
      const settings = await service.getDocumentSettings();
      return buildCurrencyConfigFromSettings(settings);
    } catch {
      return DEFAULT_CURRENCY_CONFIG;
    }
  }
);
