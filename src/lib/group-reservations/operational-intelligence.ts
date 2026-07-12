import { buildReservationBlockInsights } from "@/lib/group-reservations/block-insights";
import { calculateGroupHealthScore } from "@/lib/group-reservations/group-health-score";
import { deriveSmartAlerts } from "@/lib/group-reservations/smart-alerts";
import type { GroupOperationsOverview } from "@/lib/group-reservations/operations-overview";
import type {
  GroupIntelligenceContext,
  GroupOperationalIntelligence,
} from "@/types/group-operational-intelligence";
import type { CorporateAccount } from "@/types/corporate-account";
import type { GroupFinancialSummary } from "@/types/group-reservation";
import type { GroupTimelineEvent } from "@/types/group-timeline";
import type { ReservationBlock } from "@/types/reservation-block";

export function buildGroupOperationalIntelligence(
  groupId: string,
  overview: GroupOperationsOverview,
  blocks: ReservationBlock[],
  timeline: GroupTimelineEvent[],
  financial: GroupFinancialSummary | null,
  corporateAccount: CorporateAccount | null,
  shiftHandoverOpenIssues = 0
): GroupOperationalIntelligence {
  const ctx: GroupIntelligenceContext = {
    overview,
    blocks,
    timeline,
    financial: financial
      ? {
          outstandingBalance: financial.outstandingBalance,
          totalPayments: financial.totalPayments,
          totalCharges: financial.totalCharges,
          masterFolioId: financial.masterFolioId,
        }
      : null,
    corporateAccount,
    shiftHandoverOpenIssues,
  };

  const alerts = deriveSmartAlerts(ctx, groupId);
  const health = calculateGroupHealthScore(overview, alerts);
  const blockInsights = buildReservationBlockInsights(overview, blocks);

  return { alerts, health, blockInsights };
}
