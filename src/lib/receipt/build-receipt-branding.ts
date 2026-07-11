import type { HotelSettings } from "@/types/settings";
import type { ReceiptBranding } from "@/lib/receipt/receipt-core";

export type ExtendedReceiptBranding = ReceiptBranding;

export function buildReceiptBrandingFromHotelSettings(
  settings: HotelSettings
): ExtendedReceiptBranding {
  return {
    hotelName: settings.hotelName,
    logoUrl: settings.showHotelLogo ? settings.logoUrl || null : null,
    primaryColor: settings.primaryColor,
    address: settings.address || undefined,
    phone: settings.phone || undefined,
    email: settings.email || undefined,
    website: settings.website || undefined,
    thankYouMessage: settings.printThankYouMessage
      ? settings.receiptFooterMessage || "Thank you for staying with us!"
      : undefined,
    headerMessage: settings.receiptHeaderMessage || undefined,
    footerMessage: settings.receiptFooterMessage || settings.invoiceFooter || undefined,
    showLogo: settings.showHotelLogo,
    showQrCode: settings.showQrCode,
    taxNumber: settings.tinNumber || undefined,
    registrationNumber: settings.registrationNumber || undefined,
    paperSize: settings.paperSize,
  };
}

export function buildReceiptBrandingFromPartial(
  partial: Partial<ExtendedReceiptBranding> | undefined,
  fallback?: ExtendedReceiptBranding
): ExtendedReceiptBranding {
  return {
    hotelName: partial?.hotelName ?? fallback?.hotelName ?? "SEDVIS HOTEL",
    logoUrl: partial?.logoUrl ?? fallback?.logoUrl ?? null,
    primaryColor: partial?.primaryColor ?? fallback?.primaryColor ?? "#1e3a5f",
    address: partial?.address ?? fallback?.address,
    phone: partial?.phone ?? fallback?.phone,
    email: partial?.email ?? fallback?.email,
    website: partial?.website ?? fallback?.website,
    thankYouMessage: partial?.thankYouMessage ?? fallback?.thankYouMessage,
    headerMessage: partial?.headerMessage ?? fallback?.headerMessage,
    footerMessage: partial?.footerMessage ?? fallback?.footerMessage,
    showLogo: partial?.showLogo ?? fallback?.showLogo ?? true,
    showQrCode: partial?.showQrCode ?? fallback?.showQrCode ?? false,
    taxNumber: partial?.taxNumber ?? fallback?.taxNumber,
    registrationNumber: partial?.registrationNumber ?? fallback?.registrationNumber,
    paperSize: partial?.paperSize ?? fallback?.paperSize ?? "a4",
  };
}
