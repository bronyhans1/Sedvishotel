import type { IHotelOperatingDayRepository } from "@/repositories/hotel-operating-day.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbHotelOperatingDay } from "@/types/database";

export class SupabaseHotelOperatingDayRepository
  implements IHotelOperatingDayRepository
{
  constructor(private readonly client: SupabaseServerClient) {}

  async getSingleton(): Promise<DbHotelOperatingDay | null> {
    const { data, error } = await this.client
      .from("hotel_operating_day")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load hotel operating day: ${error.message}`);
    }

    return data;
  }

  async createSingleton(
    data: Omit<DbHotelOperatingDay, "id" | "created_at" | "updated_at"> & {
      id?: number;
    }
  ): Promise<DbHotelOperatingDay> {
    const { data: row, error } = await this.client
      .from("hotel_operating_day")
      .insert({ ...data, id: data.id ?? 1 })
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(
        `Failed to create hotel operating day: ${error?.message ?? "unknown"}`
      );
    }

    return row;
  }

  async updateSingleton(
    data: Partial<DbHotelOperatingDay>
  ): Promise<DbHotelOperatingDay> {
    const { data: row, error } = await this.client
      .from("hotel_operating_day")
      .update(data)
      .eq("id", 1)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(
        `Failed to update hotel operating day: ${error?.message ?? "unknown"}`
      );
    }

    return row;
  }
}
