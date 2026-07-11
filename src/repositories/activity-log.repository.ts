import type { BaseRepository } from "@/repositories/base.repository";
import type { PaginatedResult, PaginationParams } from "@/repositories/types";
import type {
  ActivityActionCode,
  DbActivityLog,
  DbActivityLogStatus,
} from "@/types/database";

export interface ActivityLogFilters {
  userId?: string;
  module?: string;
  actionCode?: string;
  entityType?: string;
  entityId?: string;
  status?: DbActivityLogStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateActivityLogInput {
  userId?: string;
  userName?: string;
  action: string;
  actionCode: ActivityActionCode | string;
  module: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  status?: DbActivityLogStatus;
  metadata?: Record<string, unknown>;
}

/** Centralized audit trail for reservations, payments, rooms, and staff */
export interface IActivityLogRepository {
  create(input: CreateActivityLogInput): Promise<DbActivityLog>;
  findById(id: string): Promise<DbActivityLog | null>;
  findAll(
    filters?: ActivityLogFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<DbActivityLog>>;
  findByEntityId(entityId: string, module?: string): Promise<DbActivityLog[]>;
  findReceiptPrintEvents(paymentId: string): Promise<DbActivityLog[]>;
  findRecent(limit?: number): Promise<DbActivityLog[]>;
  logReservationEvent(
    input: CreateActivityLogInput & { reservationId: string }
  ): Promise<DbActivityLog>;
  logPaymentEvent(
    input: CreateActivityLogInput & { paymentId: string }
  ): Promise<DbActivityLog>;
  logRoomStatusEvent(
    input: CreateActivityLogInput & { roomId: string; previousStatus?: string; newStatus?: string }
  ): Promise<DbActivityLog>;
  logStaffEvent(
    input: CreateActivityLogInput & { staffUserId: string }
  ): Promise<DbActivityLog>;
}

export type ActivityLogRepository = IActivityLogRepository & BaseRepository;
