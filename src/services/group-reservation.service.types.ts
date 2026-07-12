import type {
  CreateGroupInput,
  GroupFinancialSummary,
  GroupReservation,
  GroupReservationSummary,
  GroupSearchFilters,
  UpdateGroupInput,
} from "@/types/group-reservation";
import type { ReservationFormValues } from "@/types/reservation";
import type { CreateReservationBlockInput } from "@/types/reservation-block";
import type { GroupTimelineEvent } from "@/types/group-timeline";
import type { AuthSession } from "@/services/auth.service";
import type { ServiceContext } from "@/services/types";

export interface IGroupReservationService {
  createGroup(
    ctx: ServiceContext,
    session: AuthSession,
    input: CreateGroupInput
  ): Promise<GroupReservation>;
  updateGroup(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    input: UpdateGroupInput
  ): Promise<GroupReservation>;
  cancelGroup(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    reason?: string
  ): Promise<GroupReservation>;
  closeGroup(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<GroupReservation>;
  confirmGroup(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<GroupReservation>;
  getGroup(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<GroupReservation | null>;
  getGroups(
    ctx: ServiceContext,
    session: AuthSession,
    filters?: GroupSearchFilters
  ): Promise<GroupReservation[]>;
  getSummary(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<GroupReservationSummary | null>;
  getFinancialSummary(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<GroupFinancialSummary | null>;
  addReservation(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    values: ReservationFormValues,
    options?: { setAsMaster?: boolean }
  ): Promise<GroupReservation>;
  removeReservation(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    reservationId: string,
    reason?: string
  ): Promise<GroupReservation>;
  assignRoom(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    reservationId: string,
    roomNumber: string
  ): Promise<GroupReservation>;
  assignGuest(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    reservationId: string,
    values: Pick<ReservationFormValues, "guestName" | "guestPhone" | "guestEmail">
  ): Promise<GroupReservation>;
  moveReservation(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    reservationId: string,
    roomNumber: string
  ): Promise<GroupReservation>;
  changeDates(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    reservationId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<GroupReservation>;
  createBlock(
    ctx: ServiceContext,
    session: AuthSession,
    input: CreateReservationBlockInput
  ): Promise<GroupReservation>;
  releaseExpiredBlocks(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<number>;
  getTimeline(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string
  ): Promise<GroupTimelineEvent[]>;
  linkChildFolioToMaster(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    childFolioId: string,
    masterFolioId: string
  ): Promise<void>;
}
