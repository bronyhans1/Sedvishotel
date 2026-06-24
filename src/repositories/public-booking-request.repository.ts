import type { BaseRepository } from "@/repositories/base.repository";
import type { PaginatedResult, PaginationParams } from "@/repositories/types";
import type {
  DbBookingRequestStatus,
  DbPublicBookingRequest,
  DbPublicBookingRequestWithType,
} from "@/types/database";

export interface PublicBookingRequestFilters {
  status?: DbBookingRequestStatus | "all";
  roomTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CreatePublicBookingRequestInput {
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  room_type_id: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  special_requests?: string;
}

export interface IPublicBookingRequestRepository {
  findById(id: string): Promise<DbPublicBookingRequestWithType | null>;
  findByNumber(bookingRequestNumber: string): Promise<DbPublicBookingRequestWithType | null>;
  findAll(
    filters?: PublicBookingRequestFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<DbPublicBookingRequestWithType>>;
  createPending(
    input: CreatePublicBookingRequestInput
  ): Promise<DbPublicBookingRequest>;
  updateStatus(
    id: string,
    status: DbBookingRequestStatus,
    options?: {
      reviewedBy?: string;
      convertedReservationId?: string;
      rejectionReason?: string;
    }
  ): Promise<DbPublicBookingRequest>;
}

export type PublicBookingRequestRepository = IPublicBookingRequestRepository &
  BaseRepository;
