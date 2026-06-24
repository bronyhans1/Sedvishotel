import { formatCurrency } from "@/lib/utils";
import type { RoomTypeOption } from "@/types/room";
import type { RoomType } from "@/types/room-type";

export function mapRoomTypesToOptions(
  roomTypes: RoomType[],
  ensureTypeIds: string[] = []
): RoomTypeOption[] {
  const ensure = new Set(ensureTypeIds.filter(Boolean));
  return roomTypes
    .filter((type) => type.status === "active" || ensure.has(type.id))
    .map((type) => ({
      id: type.id,
      name: type.name,
      capacity: type.capacity,
      defaultPrice: type.defaultPrice,
    }));
}

export function formatRoomTypeOptionLabel(option: RoomTypeOption): string {
  const parts = [
    option.name,
    `${option.capacity} guest${option.capacity === 1 ? "" : "s"}`,
  ];
  if (option.defaultPrice > 0) {
    parts.push(formatCurrency(option.defaultPrice));
  }
  return parts.join(" · ");
}
