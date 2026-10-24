import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapDbSettingsToHotelSettings,
  mapHotelSettingsToDbUpdate,
} from "@/lib/settings/mapper";
import { defaultHotelSettings } from "@/lib/mock-data/settings";
import type { DbHotelSettings } from "@/types/database";

function baseRow(
  settingsJson: Record<string, unknown> = {}
): DbHotelSettings {
  return {
    id: "settings-1",
    hotel_name: "SEDVIS HOTEL",
    address: null,
    phone: null,
    email: null,
    website: null,
    currency: "GHS",
    timezone: "Africa/Accra",
    check_in_time: "14:00",
    check_out_time: "11:00",
    tax_rate: 0.15,
    service_charge: 0.05,
    late_checkout_fee: 100,
    late_checkout_policy_mode: "flat",
    late_checkout_hour_fee_1_2: 50,
    late_checkout_hour_fee_2_4: 100,
    late_checkout_hour_fee_4_6: 150,
    overstay_charge_mode: "none",
    overstay_manager_approval_required: false,
    overstay_allow_manual_waiver: true,
    overstay_auto_create_pending_charge: true,
    overstay_night_audit_mode: "acknowledge",
    lock_block_inventory_adjustments: false,
    lock_block_manual_payments: false,
    business_day_open_warning_hour: 6,
    correction_session_max_hours: 4,
    logo_url: null,
    tin_number: null,
    description: null,
    invoice_prefix: "INV",
    receipt_prefix: "RCP",
    invoice_footer: null,
    terms_and_conditions: null,
    email_notifications: true,
    sms_notifications: true,
    payment_alerts: true,
    reservation_alerts: true,
    housekeeping_alerts: true,
    settings_json: settingsJson,
    updated_by: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  } as DbHotelSettings;
}

describe("settings mapper — showPublicWebsitePrices", () => {
  it("defaults to true when the JSON key is absent", () => {
    const settings = mapDbSettingsToHotelSettings(baseRow({}));
    assert.equal(settings.showPublicWebsitePrices, true);
  });

  it("reads true and false from settings_json", () => {
    assert.equal(
      mapDbSettingsToHotelSettings(
        baseRow({ showPublicWebsitePrices: true })
      ).showPublicWebsitePrices,
      true
    );
    assert.equal(
      mapDbSettingsToHotelSettings(
        baseRow({ showPublicWebsitePrices: false })
      ).showPublicWebsitePrices,
      false
    );
  });

  it("writes showPublicWebsitePrices into settings_json on update", () => {
    const off = { ...defaultHotelSettings, showPublicWebsitePrices: false };
    const updateOff = mapHotelSettingsToDbUpdate(off, {});
    assert.equal(updateOff.settings_json?.showPublicWebsitePrices, false);

    const on = { ...defaultHotelSettings, showPublicWebsitePrices: true };
    const updateOn = mapHotelSettingsToDbUpdate(on, {
      showPublicWebsitePrices: false,
    });
    assert.equal(updateOn.settings_json?.showPublicWebsitePrices, true);
  });

  it("round-trips ON and OFF through map → write → map", () => {
    for (const value of [true, false] as const) {
      const mapped = {
        ...mapDbSettingsToHotelSettings(baseRow({})),
        showPublicWebsitePrices: value,
      };
      const dbUpdate = mapHotelSettingsToDbUpdate(mapped, {});
      const roundTrip = mapDbSettingsToHotelSettings(
        baseRow((dbUpdate.settings_json ?? {}) as Record<string, unknown>)
      );
      assert.equal(roundTrip.showPublicWebsitePrices, value);
    }
  });
});
