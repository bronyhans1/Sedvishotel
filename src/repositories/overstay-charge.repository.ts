import type { DbOverstayCharge, DbOverstayChargeStatus } from "@/types/database";

export type CreateOverstayChargeInput = {
  reservationId: string;
  businessDate: string;
  roomNumber: string | null;
  chargeMode: string;
  status: DbOverstayChargeStatus;
  amount: number;
  currency: string;
  nightRate: number;
  overstayDays: number;
  policySnapshot: Record<string, unknown>;
  sourceReference: string;
  decisionNotes?: string | null;
  createdBy?: string | null;
  folioEntryId?: string | null;
  postedAt?: string | null;
};

export type UpdateOverstayChargeInput = Partial<{
  status: DbOverstayChargeStatus;
  amount: number;
  folioEntryId: string | null;
  decisionNotes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  waivedBy: string | null;
  waivedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  postedAt: string | null;
}>;

export interface IOverstayChargeRepository {
  getByReservationAndBusinessDate(
    reservationId: string,
    businessDate: string
  ): Promise<DbOverstayCharge | null>;
  getById(id: string): Promise<DbOverstayCharge | null>;
  getBySourceReference(sourceReference: string): Promise<DbOverstayCharge | null>;
  listByReservation(reservationId: string): Promise<DbOverstayCharge[]>;
  listByBusinessDate(businessDate: string): Promise<DbOverstayCharge[]>;
  listByStatus(status: DbOverstayChargeStatus): Promise<DbOverstayCharge[]>;
  listPending(): Promise<DbOverstayCharge[]>;
  listAll(): Promise<DbOverstayCharge[]>;
  create(input: CreateOverstayChargeInput): Promise<DbOverstayCharge>;
  update(id: string, input: UpdateOverstayChargeInput): Promise<DbOverstayCharge>;
  hasAnyForReservation(
    reservationId: string,
    excludeStatuses?: DbOverstayChargeStatus[]
  ): Promise<boolean>;
  /** Recovery only — removes a skipped ledger row so re-evaluation can proceed. */
  deleteIfSkipped(id: string): Promise<boolean>;
}
