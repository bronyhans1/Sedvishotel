import type { DbHotelSettings } from "@/types/database";
import type { HotelSettings } from "@/types/settings";

function readJsonString(
  json: Record<string, unknown>,
  key: string,
  fallback: string
): string {
  const value = json[key];
  return typeof value === "string" ? value : fallback;
}

function readJsonBoolean(
  json: Record<string, unknown>,
  key: string,
  fallback: boolean
): boolean {
  const value = json[key];
  return typeof value === "boolean" ? value : fallback;
}

export function mapDbSettingsToHotelSettings(row: DbHotelSettings): HotelSettings {
  const json = row.settings_json ?? {};

  return {
    hotelName: row.hotel_name,
    address: row.address ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? "",
    tinNumber: row.tin_number ?? "",
    description: row.description ?? "",
    primaryColor: readJsonString(json, "primaryColor", "#1e3a5f"),
    secondaryColor: readJsonString(json, "secondaryColor", "#c9a227"),
    theme: (readJsonString(json, "theme", "system") as HotelSettings["theme"]) || "system",
    logoUrl: row.logo_url ?? "",
    faviconUrl: readJsonString(json, "faviconUrl", ""),
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time?.slice(0, 5) ?? row.check_out_time,
    lateCheckoutFee: Number(row.late_checkout_fee ?? 100),
    lateCheckoutPolicyMode:
      row.late_checkout_policy_mode === "hour_based" ? "hour_based" : "flat",
    lateCheckoutHourFee1To2: Number(row.late_checkout_hour_fee_1_2 ?? 50),
    lateCheckoutHourFee2To4: Number(row.late_checkout_hour_fee_2_4 ?? 100),
    lateCheckoutHourFee4To6: Number(row.late_checkout_hour_fee_4_6 ?? 150),
    currency: row.currency,
    timeZone: row.timezone,
    taxRate: row.tax_rate,
    serviceCharge: row.service_charge,
    invoicePrefix: row.invoice_prefix,
    receiptPrefix: row.receipt_prefix,
    invoiceFooter: row.invoice_footer ?? "",
    termsAndConditions: row.terms_and_conditions ?? "",
    reservationEmailTemplate: readJsonString(json, "reservationEmailTemplate", ""),
    invoiceEmailTemplate: readJsonString(json, "invoiceEmailTemplate", ""),
    reminderEmailTemplate: readJsonString(json, "reminderEmailTemplate", ""),
    emailNotifications: row.email_notifications,
    smsNotifications: row.sms_notifications,
    paymentAlerts: row.payment_alerts,
    reservationAlerts: row.reservation_alerts,
    housekeepingAlerts: row.housekeeping_alerts,
  };
}

export function mapHotelSettingsToDbUpdate(
  settings: HotelSettings,
  existingJson: Record<string, unknown> = {}
): Partial<DbHotelSettings> {
  return {
    hotel_name: settings.hotelName,
    address: settings.address || null,
    phone: settings.phone || null,
    email: settings.email || null,
    website: settings.website || null,
    tin_number: settings.tinNumber || null,
    description: settings.description || null,
    check_in_time: settings.checkInTime,
    check_out_time: settings.checkOutTime,
    late_checkout_fee: settings.lateCheckoutFee,
    late_checkout_policy_mode: settings.lateCheckoutPolicyMode,
    late_checkout_hour_fee_1_2: settings.lateCheckoutHourFee1To2,
    late_checkout_hour_fee_2_4: settings.lateCheckoutHourFee2To4,
    late_checkout_hour_fee_4_6: settings.lateCheckoutHourFee4To6,
    currency: settings.currency,
    timezone: settings.timeZone,
    tax_rate: settings.taxRate,
    service_charge: settings.serviceCharge,
    invoice_prefix: settings.invoicePrefix,
    receipt_prefix: settings.receiptPrefix,
    invoice_footer: settings.invoiceFooter || null,
    terms_and_conditions: settings.termsAndConditions || null,
    logo_url: settings.logoUrl || null,
    email_notifications: settings.emailNotifications,
    sms_notifications: settings.smsNotifications,
    payment_alerts: settings.paymentAlerts,
    reservation_alerts: settings.reservationAlerts,
    housekeeping_alerts: settings.housekeepingAlerts,
    settings_json: {
      ...existingJson,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      theme: settings.theme,
      faviconUrl: settings.faviconUrl || null,
      reservationEmailTemplate: settings.reservationEmailTemplate,
      invoiceEmailTemplate: settings.invoiceEmailTemplate,
      reminderEmailTemplate: settings.reminderEmailTemplate,
    },
  };
}
