import { getSettingsAccess } from "@/lib/auth/settings-access";
import {
  mapDbSettingsToHotelSettings,
  mapHotelSettingsToDbUpdate,
} from "@/lib/settings/mapper";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { ISettingsRepository } from "@/repositories/settings.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { HotelSettings } from "@/types/settings";

export interface ISettingsService {
  getHotelSettings(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<HotelSettings>;
  updateHotelSettings(
    ctx: ServiceContext,
    session: AuthSession,
    data: HotelSettings
  ): Promise<HotelSettings>;
}

export class SettingsService implements ISettingsService {
  constructor(
    private readonly settings: ISettingsRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private requireView(session: AuthSession): void {
    if (!getSettingsAccess(session).canView) {
      throw new ServiceError("Forbidden: settings.view required.", "FORBIDDEN", 403);
    }
  }

  private requireManage(session: AuthSession): void {
    if (!getSettingsAccess(session).canManage) {
      throw new ServiceError("Forbidden: settings edit required.", "FORBIDDEN", 403);
    }
  }

  async getHotelSettings(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<HotelSettings> {
    this.requireView(session);
    const row = await this.settings.getActive();
    if (!row) {
      throw new ServiceError("Hotel settings not configured.", "NOT_FOUND", 404);
    }
    return mapDbSettingsToHotelSettings(row);
  }

  async updateHotelSettings(
    ctx: ServiceContext,
    session: AuthSession,
    data: HotelSettings
  ): Promise<HotelSettings> {
    this.requireManage(session);
    const existing = await this.settings.getActive();
    if (!existing) {
      throw new ServiceError("Hotel settings not configured.", "NOT_FOUND", 404);
    }

    const updated = await this.settings.update(
      existing.id,
      mapHotelSettingsToDbUpdate(data, existing.settings_json),
      ctx.userId
    );

    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: "Updated hotel settings",
      actionCode: ActivityActionCodes.SETTINGS_UPDATED,
      module: "settings",
      entityType: "hotel_settings",
      entityId: updated.id,
    });

    return mapDbSettingsToHotelSettings(updated);
  }
}
