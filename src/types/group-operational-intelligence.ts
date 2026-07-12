import type { GroupOperationsOverview } from "@/lib/group-reservations/operations-overview";
import type { ReservationBlock } from "@/types/reservation-block";
import type { GroupTimelineEvent } from "@/types/group-timeline";
import type { CorporateAccount } from "@/types/corporate-account";

export type AlertSeverity = "information" | "warning" | "critical";

export type SmartAlertAction =
  | "assign_rooms"
  | "open_master_folio"
  | "collect_deposit"
  | "view_blocks"
  | "resolve_issue"
  | "view_timeline"
  | "record_payment"
  | "view_company"
  | "bulk_check_in"
  | "bulk_check_out"
  | "view_reservations";

export type SmartAlert = {
  id: string;
  severity: AlertSeverity;
  message: string;
  suggestedAction: string;
  action?: SmartAlertAction;
  href?: string;
  tab?: string;
};

export type GroupHealthStatus = "healthy" | "attention" | "critical";

export type GroupHealthScore = {
  status: GroupHealthStatus;
  score: number;
  label: string;
  factors: Array<{ label: string; impact: number; status: GroupHealthStatus }>;
};

export type BlockOccupancyStrip = {
  requested: number;
  blocked: number;
  allocated: number;
  checkedIn: number;
  released: number;
  expired: number;
  remaining: number;
  percentages: {
    blocked: number;
    allocated: number;
    checkedIn: number;
    released: number;
    expired: number;
    remaining: number;
  };
};

export type ReservationBlockInsights = {
  roomsRequested: number;
  roomsAllocated: number;
  roomsRemaining: number;
  roomsReleased: number;
  blocksExpiringToday: number;
  blocksExpiringWithin24h: number;
  averageAllocationRate: number;
  occupancyContribution: number;
  strip: BlockOccupancyStrip;
  blocks: Array<
    ReservationBlock & {
      countdownMs: number | null;
      expiringSoon: boolean;
      occupancyImpact: number;
    }
  >;
};

export type GroupOperationalIntelligence = {
  alerts: SmartAlert[];
  health: GroupHealthScore;
  blockInsights: ReservationBlockInsights;
};

export type CorporateExecutiveMetrics = {
  totalReservations: number;
  activeGroups: number;
  annualRevenue: number;
  monthlyRevenue: number;
  outstandingBalance: number;
  creditUsed: number;
  creditRemaining: number | null;
  averageStay: number;
  averageGroupSize: number;
  averageSpend: number;
  currentGroups: number;
  upcomingGroups: number;
  completedGroups: number;
  cancelledGroups: number;
  lastStay: string | null;
  nextArrival: string | null;
  mostUsedRoomType: string | null;
  mostFrequentGuest: string | null;
  vipGuests: number;
  returningGuests: number;
};

export type CorporateTrendPoint = {
  label: string;
  revenue: number;
  reservations: number;
  outstanding: number;
  averageSpend: number;
};

export type CorporateTimelineEntry = {
  id: string;
  category: "financial" | "operational" | "guests" | "rooms" | "documents";
  eventType: string;
  label: string;
  description: string;
  createdAt: string;
  href?: string;
};

export type CorporateOperationalIntelligence = {
  metrics: CorporateExecutiveMetrics;
  trends: CorporateTrendPoint[];
  timeline: CorporateTimelineEntry[];
  health: GroupHealthStatus;
  account: CorporateAccount;
};

export type GroupIntelligenceContext = {
  overview: GroupOperationsOverview;
  blocks: ReservationBlock[];
  timeline: GroupTimelineEvent[];
  financial: {
    outstandingBalance: number;
    totalPayments: number;
    totalCharges: number;
    masterFolioId: string | null;
  } | null;
  corporateAccount: CorporateAccount | null;
  shiftHandoverOpenIssues?: number;
};
