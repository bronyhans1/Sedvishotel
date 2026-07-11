import { mapDbSettingsToHotelSettings } from "@/lib/settings/mapper";
import type { ISettingsRepository } from "@/repositories/settings.repository";
import { ServiceError } from "@/services/types";
import type { HotelSettings } from "@/types/settings";

/**
 * Runtime document configuration.
 *
 * Hotel branding, receipt/invoice prefixes, currency, footer notes, terms,
 * logos and printing preferences are APPLICATION CONFIGURATION required to
 * render operational documents (receipts, invoices, folios, check-out). They
 * are NOT privileged administrative data, so reading them for document
 * rendering does not require `settings.view` / `settings.edit`.
 *
 * The Administration → Settings screen and all settings mutations continue to
 * use `SettingsService`, which still enforces `settings.view` / `settings.edit`.
 * This service deliberately performs NO permission check — mirroring the
 * existing `getDefaultTaxRate()` helper, which already reads tax configuration
 * without `settings.view`.
 *
 * The value returned here is for SERVER-SIDE document rendering only. Callers
 * must expose only curated, non-sensitive subsets to the client (see
 * `loadHotelDocumentSettings`), never the full settings object.
 */
export interface IDocumentConfigService {
  getDocumentSettings(): Promise<HotelSettings>;
}

export class DocumentConfigService implements IDocumentConfigService {
  constructor(private readonly settings: ISettingsRepository) {}

  async getDocumentSettings(): Promise<HotelSettings> {
    const row = await this.settings.getActive();
    if (!row) {
      throw new ServiceError("Hotel settings not configured.", "NOT_FOUND", 404);
    }
    return mapDbSettingsToHotelSettings(row);
  }
}
