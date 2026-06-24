import type {
  HotelBrandingSettings,
  ISettingsRepository,
  OperatingHoursSettings,
  TaxAndChargeSettings,
} from "@/repositories/settings.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbHotelSettings } from "@/types/database";

export class SupabaseSettingsRepository implements ISettingsRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getActive(): Promise<DbHotelSettings | null> {
    const { data, error } = await this.client
      .from("hotel_settings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load hotel settings: ${error.message}`);
    }

    return data;
  }

  async update(
    id: string,
    data: Partial<DbHotelSettings>,
    updatedBy?: string
  ): Promise<DbHotelSettings> {
    const { data: row, error } = await this.client
      .from("hotel_settings")
      .update({
        ...data,
        updated_by: updatedBy ?? data.updated_by ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to update hotel settings: ${error?.message}`);
    }

    return row;
  }

  async getBranding(): Promise<HotelBrandingSettings | null> {
    const row = await this.getActive();
    if (!row) return null;

    const json = row.settings_json ?? {};
    return {
      hotelName: row.hotel_name,
      logoUrl: row.logo_url,
      description: row.description,
      primaryColor:
        typeof json.primaryColor === "string" ? json.primaryColor : undefined,
      secondaryColor:
        typeof json.secondaryColor === "string" ? json.secondaryColor : undefined,
    };
  }

  async getTaxAndCharges(): Promise<TaxAndChargeSettings | null> {
    const row = await this.getActive();
    if (!row) return null;

    return {
      currency: row.currency,
      taxRate: row.tax_rate,
      serviceCharge: row.service_charge,
    };
  }

  async getOperatingHours(): Promise<OperatingHoursSettings | null> {
    const row = await this.getActive();
    if (!row) return null;

    return {
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      timezone: row.timezone,
    };
  }
}
