import type { AuthSession } from "@/services/auth.service";
import type { ServiceContext } from "@/services/types";
import { buildReceiptBrandingFromHotelSettings } from "@/lib/receipt/build-receipt-branding";
import type { ReceiptBranding } from "@/lib/receipt/receipt-core";
import { getSettingsService } from "@/lib/settings/get-settings-service";
import type { HotelSettings } from "@/types/settings";

export type InvoiceDocumentSettings = Pick<
  HotelSettings,
  | "address"
  | "phone"
  | "email"
  | "website"
  | "tinNumber"
  | "taxRate"
  | "invoiceFooter"
  | "termsAndConditions"
>;

export function buildInvoiceDocumentSettings(
  settings: HotelSettings
): InvoiceDocumentSettings {
  return {
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
    tinNumber: settings.tinNumber,
    taxRate: settings.taxRate,
    invoiceFooter: settings.invoiceFooter,
    termsAndConditions: settings.termsAndConditions,
  };
}

export async function loadHotelDocumentSettings(
  ctx: ServiceContext,
  session: AuthSession
): Promise<{
  hotelSettings: HotelSettings;
  invoiceDocumentSettings: InvoiceDocumentSettings;
  receiptBranding: ReceiptBranding;
}> {
  const settingsService = await getSettingsService();
  const hotelSettings = await settingsService.getHotelSettings(ctx, session);

  return {
    hotelSettings,
    invoiceDocumentSettings: buildInvoiceDocumentSettings(hotelSettings),
    receiptBranding: buildReceiptBrandingFromHotelSettings(hotelSettings),
  };
}
