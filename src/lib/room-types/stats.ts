import type { RoomType, RoomTypeStats } from "@/types/room-type";

export function computeRoomTypeStats(types: RoomType[]): RoomTypeStats {
  const prices = types.map((t) => t.defaultPrice);
  const sum = prices.reduce((a, b) => a + b, 0);
  return {
    totalTypes: types.length,
    averagePrice: types.length ? Math.round(sum / types.length) : 0,
    highestPrice: prices.length ? Math.max(...prices) : 0,
    lowestPrice: prices.length ? Math.min(...prices) : 0,
  };
}
