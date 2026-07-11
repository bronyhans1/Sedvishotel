import { getDocumentConfigService } from "@/lib/documents/get-document-config-service";
import { buildReceiptBrandingFromHotelSettings } from "@/lib/receipt/build-receipt-branding";
import type { ReceiptBranding } from "@/lib/receipt/receipt-core";
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

/**
 * Loads the curated, non-sensitive document configuration required for
 * rendering receipts and invoices in operational modules.
 *
 * This does NOT require `settings.view` — it reads runtime document
 * configuration via {@link getDocumentConfigService}. Only curated subsets
 * (branding + invoice document fields) are returned; the full settings object
 * (which includes notification/email-template configuration) never leaves the
 * server through this loader.
 */
export async function loadHotelDocumentSettings(): Promise<{
  invoiceDocumentSettings: InvoiceDocumentSettings;
  receiptBranding: ReceiptBranding;
}> {
  const service = await getDocumentConfigService();
  const settings = await service.getDocumentSettings();

  return {
    invoiceDocumentSettings: buildInvoiceDocumentSettings(settings),
    receiptBranding: buildReceiptBrandingFromHotelSettings(settings),
  };
}
