import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getInvoiceAccess } from "@/lib/auth/invoice-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getInvoiceService } from "@/lib/invoices/get-invoice-service";
import { getSettingsService } from "@/lib/settings/get-settings-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadInvoiceDetail(id: string) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getInvoiceAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getInvoiceService();
  const invoice = await service.getById(ctx, session, id);

  if (!invoice) {
    notFound();
  }

  const settingsService = await getSettingsService();
  const hotelSettings = await settingsService.getHotelSettings(ctx, session);

  return {
    invoice,
    access,
    documentSettings: {
      address: hotelSettings.address,
      phone: hotelSettings.phone,
      email: hotelSettings.email,
      website: hotelSettings.website,
      tinNumber: hotelSettings.tinNumber,
      taxRate: hotelSettings.taxRate,
      invoiceFooter: hotelSettings.invoiceFooter,
      termsAndConditions: hotelSettings.termsAndConditions,
    },
  };
}
