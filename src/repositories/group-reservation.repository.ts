import type { DbGroupReservation, DbReservationWithRelations } from "@/types/database";
import type { GroupSearchFilters } from "@/types/group-reservation";

export interface IGroupReservationRepository {
  getById(id: string): Promise<DbGroupReservation | null>;
  getByGroupNumber(groupNumber: string): Promise<DbGroupReservation | null>;
  list(filters?: GroupSearchFilters): Promise<DbGroupReservation[]>;
  search(query: string): Promise<DbGroupReservation[]>;
  create(
    data: Omit<DbGroupReservation, "id" | "created_at" | "updated_at" | "group_number">
  ): Promise<DbGroupReservation>;
  update(id: string, data: Partial<DbGroupReservation>): Promise<DbGroupReservation>;
  nextGroupNumber(): Promise<string>;
  listReservations(groupId: string): Promise<DbReservationWithRelations[]>;
  countReservationsByStatus(
    groupId: string
  ): Promise<{ total: number; checkedIn: number; checkedOut: number }>;
}
