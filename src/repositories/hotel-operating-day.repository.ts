import type { BaseRepository } from "@/repositories/base.repository";
import type { DbHotelOperatingDay } from "@/types/database";

export interface IHotelOperatingDayRepository {
  getSingleton(): Promise<DbHotelOperatingDay | null>;
  createSingleton(
    data: Omit<DbHotelOperatingDay, "id" | "created_at" | "updated_at"> & {
      id?: number;
    }
  ): Promise<DbHotelOperatingDay>;
  updateSingleton(
    data: Partial<DbHotelOperatingDay>
  ): Promise<DbHotelOperatingDay>;
}

export type HotelOperatingDayRepository = IHotelOperatingDayRepository &
  BaseRepository;
