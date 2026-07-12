import type { BaseRepository } from "@/repositories/base.repository";
import type { DbHotelSettings } from "@/types/database";

export interface HotelBrandingSettings {
  hotelName: string;
  logoUrl: string | null;
  description: string | null;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface TaxAndChargeSettings {
  currency: string;
  taxRate: number;
  serviceCharge: number;
  requireRateOverrideApproval?: boolean;
}

export interface OperatingHoursSettings {
  checkInTime: string;
  checkOutTime: string;
  timezone: string;
}

/** Singleton hotel configuration — branding, taxes, operating hours */
export interface ISettingsRepository {
  getActive(): Promise<DbHotelSettings | null>;
  update(
    id: string,
    data: Partial<DbHotelSettings>,
    updatedBy?: string
  ): Promise<DbHotelSettings>;
  getBranding(): Promise<HotelBrandingSettings | null>;
  getTaxAndCharges(): Promise<TaxAndChargeSettings | null>;
  getOperatingHours(): Promise<OperatingHoursSettings | null>;
}

export type SettingsRepository = ISettingsRepository & BaseRepository;
