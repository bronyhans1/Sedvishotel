export type NightAuditStatus = "open" | "closed";

export type NightAuditRevisionEventType = "closed" | "reopened" | "reclosed";

export type ShiftType = "morning" | "afternoon" | "night";

export type NightAudit = {
  id: string;
  auditNumber: string;
  auditDate: string;
  openedAt: string;
  closedAt: string | null;
  openedById: string | null;
  openedByName: string | null;
  closedById: string | null;
  closedByName: string | null;
  status: NightAuditStatus;
  roomsOccupied: number;
  roomsAvailable: number;
  roomsCleaning: number;
  roomsMaintenance: number;
  checkIns: number;
  checkOuts: number;
  activeStays: number;
  cashTotal: number;
  mobileMoneyTotal: number;
  cardTotal: number;
  bankTransferTotal: number;
  otherTotal: number;
  grossRevenue: number;
  refundTotal: number;
  netRevenue: number;
  vatCollected: number;
  vatExemptRevenue: number;
  vatOverrideCount: number;
  cashExpected: number | null;
  cashCounted: number | null;
  cashVariance: number | null;
  varianceNotes: string | null;
  notes: string | null;
  reopenedAt: string | null;
  reopenedById: string | null;
  reopenedByName: string | null;
  reopenReason: string | null;
  revisionNumber: number;
  shiftHandoverId: string | null;
  shiftHandoverNumber: string | null;
  shiftType: ShiftType | null;
};

export type NightAuditRevision = {
  id: string;
  nightAuditId: string;
  revisionNumber: number;
  eventType: NightAuditRevisionEventType;
  closedById: string | null;
  closedByName: string | null;
  closedAt: string | null;
  reopenedById: string | null;
  reopenedByName: string | null;
  reopenedAt: string | null;
  reopenReason: string | null;
  roomsOccupied: number | null;
  roomsAvailable: number | null;
  roomsCleaning: number | null;
  roomsMaintenance: number | null;
  checkIns: number | null;
  checkOuts: number | null;
  activeStays: number | null;
  cashTotal: number | null;
  mobileMoneyTotal: number | null;
  cardTotal: number | null;
  bankTransferTotal: number | null;
  otherTotal: number | null;
  grossRevenue: number | null;
  refundTotal: number | null;
  netRevenue: number | null;
  vatCollected: number | null;
  vatExemptRevenue: number | null;
  vatOverrideCount: number | null;
  cashExpected: number | null;
  cashCounted: number | null;
  cashVariance: number | null;
  varianceNotes: string | null;
  notes: string | null;
  createdAt: string;
};

export type NightAuditSnapshot = Pick<
  NightAudit,
  | "roomsOccupied"
  | "roomsAvailable"
  | "roomsCleaning"
  | "roomsMaintenance"
  | "checkIns"
  | "checkOuts"
  | "activeStays"
  | "cashTotal"
  | "mobileMoneyTotal"
  | "cardTotal"
  | "bankTransferTotal"
  | "otherTotal"
  | "grossRevenue"
  | "refundTotal"
  | "netRevenue"
  | "vatCollected"
  | "vatExemptRevenue"
  | "vatOverrideCount"
> & {
  /** Guest folio ledger totals for the business date (Stage 5). */
  folioAccommodationRevenue?: number;
  folioRetailRevenue?: number;
  folioMiscCharges?: number;
  folioCreditsTotal?: number;
  folioPaymentsTotal?: number;
  folioVatTotal?: number;
  folioOutstandingBalance?: number;
};

export type NightAuditPageData = {
  businessDate: string;
  currentAudit: NightAudit | null;
  blockedByOpenAudit: NightAudit | null;
  liveSnapshot: NightAuditSnapshot | null;
  history: NightAudit[];
  overstayWarning?: import("@/types/overstay").OverstayNightAuditWarning | null;
  commandCenter?: import("@/types/operational-integrity").NightAuditCommandCenter | null;
};

export type CloseNightAuditInput = {
  /** Business day / audit_date being closed (YYYY-MM-DD). */
  auditDate: string;
  cashCounted: number;
  notes?: string;
  varianceNotes?: string;
  /** Required when Hotel Policy overstayNightAuditMode is acknowledge / require_manager. */
  overstayAcknowledged?: boolean;
  /** Enterprise Operational Governance */
  closeClassification?: import("@/lib/night-audit/audit-window").NightAuditCloseClassification;
  closeWallClock?: string;
  delayMinutes?: number;
  managerOverride?: boolean;
  overrideReason?: string;
};
