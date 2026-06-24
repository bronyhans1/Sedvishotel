"use server";

import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getAnalyticsAccess } from "@/lib/auth/analytics-access";
import { getServiceContext } from "@/lib/auth/service-context";
import { getAnalyticsService } from "@/lib/analytics/get-analytics-service";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { ActivityActionCodes } from "@/types/database/enums";
import type { ReportsData } from "@/types/reports";

export type ReportExportResult =
  | { success: true; message: string; csvContent?: string }
  | { success: false; error: string };

function buildCsv(data: ReportsData): string {
  const lines = [
    "SHMS Reports Export",
    "",
    "Occupancy Report",
    `Total Rooms,${data.occupancy.totalRooms}`,
    `Occupied,${data.occupancy.occupiedRooms}`,
    `Available,${data.occupancy.availableRooms}`,
    `Reserved,${data.occupancy.reservedRooms}`,
    `Cleaning,${data.occupancy.cleaningRooms}`,
    `Maintenance,${data.occupancy.maintenanceRooms}`,
    `Occupancy %,${data.occupancy.occupancyPercentage}`,
    "",
    "Revenue Report",
    `Daily,${data.revenue.daily}`,
    `Weekly,${data.revenue.weekly}`,
    `Monthly,${data.revenue.monthly}`,
    `Yearly,${data.revenue.yearly}`,
    `Outstanding Balances,${data.revenue.outstandingBalances}`,
    `Paid Invoices,${data.revenue.paidInvoices}`,
    `Unpaid Invoices,${data.revenue.unpaidInvoices}`,
    "",
    "Guest Report",
    `Total Guests,${data.guests.totalGuests}`,
    `Returning,${data.guests.returningGuests}`,
    `VIP,${data.guests.vipGuests}`,
    `Avg Stay (nights),${data.guests.averageStayDuration}`,
    "",
    "Reservation Report",
    ...Object.entries(data.reservations).map(([k, v]) => `${k},${v}`),
    "",
    "Payment Report",
    `Outstanding,${data.payments.outstandingBalances}`,
    `Refunds,${data.payments.refundSummary.count}`,
    `Refund Amount,${data.payments.refundSummary.amount}`,
    ...data.payments.byMethod.map((m) => `${m.label},${m.value}`),
  ];
  return lines.join("\n");
}

async function logReportExport(
  ctx: { userId: string },
  session: { fullName: string },
  format: string
): Promise<void> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();
  const logs = new SupabaseActivityLogRepository(client);
  await logs.create({
    userId: ctx.userId,
    userName: session.fullName,
    action: `Report exported (${format})`,
    actionCode: ActivityActionCodes.REPORT_GENERATED,
    module: "reports",
    entityType: "report",
    metadata: { format },
  });
}

export async function exportReportAction(
  format: "PDF" | "Excel" | "CSV"
): Promise<ReportExportResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const access = getAnalyticsAccess(session);
    if (!access.canViewReports) {
      return {
        success: false,
        error: toSafeActionError(new Error("Forbidden: reports view required")),
      };
    }

    const service = await getAnalyticsService();
    const data = await service.getReportsData(ctx, session);

    await logReportExport(ctx, session, format);

    if (format === "CSV") {
      return {
        success: true,
        message: "CSV export ready.",
        csvContent: buildCsv(data),
      };
    }

    return {
      success: true,
      message: `${format} export queued with live report data.`,
    };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
