import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { defaultHotelSettings } from "@/lib/mock-data/settings";
import { permissionCode } from "@/lib/database/rbac";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { ISettingsRepository } from "@/repositories/settings.repository";
import { SettingsService } from "@/services/settings.service";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { DbHotelSettings } from "@/types/database";

function session(overrides: Partial<AuthSession>): AuthSession {
  return {
    userId: "user-1",
    fullName: "Test User",
    roleId: "manager",
    permissions: [permissionCode("settings", "view")],
    email: "test@example.com",
    mustChangePassword: false,
    ...overrides,
  };
}

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

describe("SettingsService — showPublicWebsitePrices authorization", () => {
  it("rejects update when the staff member cannot manage settings", async () => {
    const repo: ISettingsRepository = {
      getActive: async () => baseRow({ showPublicWebsitePrices: true }),
      update: async () => {
        throw new Error("update should not be called");
      },
      getBranding: async () => null,
      getTaxAndCharges: async () => null,
      getOperatingHours: async () => null,
    };
    const activity: IActivityLogRepository = {
      create: async () => {
        throw new Error("activity should not be logged");
      },
    } as unknown as IActivityLogRepository;

    const service = new SettingsService(repo, activity);
    const viewer = session({
      roleId: "manager",
      permissions: [permissionCode("settings", "view")],
    });

    await assert.rejects(
      () =>
        service.updateHotelSettings(
          { userId: viewer.userId, roleId: viewer.roleId },
          viewer,
          { ...defaultHotelSettings, showPublicWebsitePrices: false }
        ),
      (err: unknown) =>
        err instanceof ServiceError && err.code === "FORBIDDEN"
    );
  });

  it("persists ON and OFF when the staff member can manage settings", async () => {
    let savedFlag: boolean | undefined;
    const existing = baseRow({ showPublicWebsitePrices: true });

    const repo: ISettingsRepository = {
      getActive: async () => existing,
      update: async (_id, data) => {
        const json = (data.settings_json ?? {}) as Record<string, unknown>;
        savedFlag =
          typeof json.showPublicWebsitePrices === "boolean"
            ? json.showPublicWebsitePrices
            : undefined;
        return {
          ...existing,
          settings_json: json,
        };
      },
      getBranding: async () => null,
      getTaxAndCharges: async () => null,
      getOperatingHours: async () => null,
    };
    const activity: IActivityLogRepository = {
      create: async () => ({ id: "log-1" }),
    } as unknown as IActivityLogRepository;

    const service = new SettingsService(repo, activity);
    const admin = session({
      roleId: "admin",
      permissions: [
        permissionCode("settings", "view"),
        permissionCode("settings", "manage"),
      ],
    });

    const off = await service.updateHotelSettings(
      { userId: admin.userId, roleId: admin.roleId },
      admin,
      { ...defaultHotelSettings, showPublicWebsitePrices: false }
    );
    assert.equal(off.showPublicWebsitePrices, false);
    assert.equal(savedFlag, false);

    const on = await service.updateHotelSettings(
      { userId: admin.userId, roleId: admin.roleId },
      admin,
      { ...defaultHotelSettings, showPublicWebsitePrices: true }
    );
    assert.equal(on.showPublicWebsitePrices, true);
    assert.equal(savedFlag, true);
  });
});
