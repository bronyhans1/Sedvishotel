export type RoomTypeStatus = "active" | "inactive";

import type { RoomTypePricingPresetForm, RoomTypePricingRule } from "@/types/pricing";

export type RoomType = {
  id: string;
  uuid: string;
  name: string;
  description: string;
  defaultPrice: number;
  capacity: number;
  amenities: string[];
  status: RoomTypeStatus;
  assignedRoomNumbers: string[];
  pricingRules: RoomTypePricingRule[];
};

export type RoomTypeStats = {
  totalTypes: number;
  averagePrice: number;
  highestPrice: number;
  lowestPrice: number;
};

export type RoomTypeFormValues = {
  name: string;
  description: string;
  defaultPrice: number;
  capacity: number;
  amenities: string;
  pricingPresets: RoomTypePricingPresetForm[];
};
