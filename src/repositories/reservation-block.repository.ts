import type { DbReservationBlock } from "@/types/database";

export interface IReservationBlockRepository {
  getById(id: string): Promise<DbReservationBlock | null>;
  listByGroup(groupId: string): Promise<DbReservationBlock[]>;
  listActiveBlockedRoomIds(checkIn: string, checkOut: string): Promise<string[]>;
  listExpiredBlocks(asOf?: string): Promise<DbReservationBlock[]>;
  create(
    data: Omit<DbReservationBlock, "id" | "created_at" | "released_at">
  ): Promise<DbReservationBlock>;
  update(id: string, data: Partial<DbReservationBlock>): Promise<DbReservationBlock>;
}
