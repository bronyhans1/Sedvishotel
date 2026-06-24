export type NightAuditStatus = "open" | "closed";

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
  cashExpected: number | null;
  cashCounted: number | null;
  cashVariance: number | null;
  varianceNotes: string | null;
  notes: string | null;
  reopenedAt: string | null;
  reopenedById: string | null;
  reopenedByName: string | null;
  reopenReason: string | null;
  shiftHandoverId: string | null;
  shiftHandoverNumber: string | null;
  shiftType: ShiftType | null;
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
>;

export type NightAuditPageData = {
  businessDate: string;
  currentAudit: NightAudit;
  liveSnapshot: NightAuditSnapshot;
  history: NightAudit[];
};

export type CloseNightAuditInput = {
  cashCounted: number;
  notes?: string;
  varianceNotes?: string;
};
