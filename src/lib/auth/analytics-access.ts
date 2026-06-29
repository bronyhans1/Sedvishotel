import { sessionHasPermission } from "@/lib/auth/permissions";
import type { AnalyticsAccess } from "@/lib/auth/analytics-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getAnalyticsAccess(session: AuthSession): AnalyticsAccess {
  const canViewRevenue = sessionHasPermission(session, "revenue", "view");
  const canViewReports = sessionHasPermission(session, "reports", "view");
  const canViewDashboard = sessionHasPermission(session, "dashboard", "view");

  const showFinancials =
    session.roleId === "admin" ||
    session.roleId === "manager" ||
    session.roleId === "receptionist" ||
    canViewRevenue;

  return {
    canViewRevenue,
    canViewReports,
    canViewDashboard,
    showFinancials:
      session.roleId !== "housekeeping" && showFinancials,
  };
}

export function requireRevenueView(session: AuthSession): void {
  if (!sessionHasPermission(session, "revenue", "view")) {
    throw new Error("Forbidden: revenue.view required");
  }
}

export function requireReportsView(session: AuthSession): void {
  if (!sessionHasPermission(session, "reports", "view")) {
    throw new Error("Forbidden: reports.view required");
  }
}

export function requireDashboardView(session: AuthSession): void {
  if (!sessionHasPermission(session, "dashboard", "view")) {
    throw new Error("Forbidden: dashboard.view required");
  }
}
