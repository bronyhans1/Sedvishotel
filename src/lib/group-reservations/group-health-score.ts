import type {
  GroupHealthScore,
  GroupHealthStatus,
  SmartAlert,
} from "@/types/group-operational-intelligence";
import type { GroupOperationsOverview } from "@/lib/group-reservations/operations-overview";

function statusFromScore(score: number): GroupHealthStatus {
  if (score >= 80) return "healthy";
  if (score >= 50) return "attention";
  return "critical";
}

function statusLabel(status: GroupHealthStatus): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "attention":
      return "Attention Needed";
    case "critical":
      return "Critical";
  }
}

export function calculateGroupHealthScore(
  overview: GroupOperationsOverview,
  alerts: SmartAlert[]
): GroupHealthScore {
  let score = 100;
  const factors: GroupHealthScore["factors"] = [];

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  if (criticalCount > 0) {
    const impact = Math.min(40, criticalCount * 15);
    score -= impact;
    factors.push({
      label: `${criticalCount} critical alert(s)`,
      impact: -impact,
      status: "critical",
    });
  }

  if (warningCount > 0) {
    const impact = Math.min(25, warningCount * 5);
    score -= impact;
    factors.push({
      label: `${warningCount} warning(s)`,
      impact: -impact,
      status: "attention",
    });
  }

  if (overview.outstandingBalance > 0) {
    const impact = overview.outstandingBalance > 10000 ? 15 : 8;
    score -= impact;
    factors.push({
      label: "Outstanding balance",
      impact: -impact,
      status: overview.outstandingBalance > 10000 ? "critical" : "attention",
    });
  }

  if (overview.roomsRemaining > 0 && overview.group.arrivalDate <= new Date().toISOString().slice(0, 10)) {
    const impact = Math.min(20, overview.roomsRemaining * 4);
    score -= impact;
    factors.push({
      label: "Unassigned rooms",
      impact: -impact,
      status: overview.roomsRemaining > 2 ? "critical" : "attention",
    });
  }

  if (overview.expiringBlocks > 0) {
    score -= 10;
    factors.push({
      label: "Expiring blocks",
      impact: -10,
      status: "attention",
    });
  }

  if (overview.corporateCreditStatus === "exceeded") {
    score -= 20;
    factors.push({
      label: "Credit limit exceeded",
      impact: -20,
      status: "critical",
    });
  } else if (overview.corporateCreditStatus === "warning") {
    score -= 8;
    factors.push({
      label: "Credit approaching limit",
      impact: -8,
      status: "attention",
    });
  }

  const taskTotal = overview.pendingCheckInsToday + overview.pendingCheckOutsToday;
  if (taskTotal > 0) {
    const impact = Math.min(12, taskTotal * 2);
    score -= impact;
    factors.push({
      label: "Pending arrivals/departures",
      impact: -impact,
      status: taskTotal > 5 ? "attention" : "healthy",
    });
  }

  if (overview.outstandingIssues > 0) {
    score -= overview.outstandingIssues * 5;
    factors.push({
      label: "Open issues",
      impact: -overview.outstandingIssues * 5,
      status: "attention",
    });
  }

  score = Math.max(0, Math.min(100, score));
  const status = statusFromScore(score);

  return {
    status,
    score,
    label: statusLabel(status),
    factors,
  };
}
