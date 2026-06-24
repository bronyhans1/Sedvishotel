"use server";

import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateOperationalFinancePaths } from "@/lib/cache/revalidate-finance-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { buildNightAuditCsv } from "@/lib/night-audit/format";
import { getNightAuditService } from "@/lib/night-audit/get-night-audit-service";
import { ServiceError } from "@/services/types";
import type { CloseNightAuditInput, NightAudit } from "@/types/night-audit";

export type NightAuditActionResult =
  | { success: true; audit?: NightAudit }
  | { success: false; error: string; code?: string };

export type NightAuditExportResult =
  | { success: true; content: string; filename: string }
  | { success: false; error: string };

function toActionResult(err: unknown): NightAuditActionResult {
  const code = err instanceof ServiceError ? err.code : undefined;
  return {
    success: false,
    error: toSafeActionError(err),
    ...(code ? { code } : {}),
  };
}

export async function closeNightAuditAction(
  input: CloseNightAuditInput
): Promise<NightAuditActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getNightAuditService();
    const audit = await service.closeDay(ctx, session, input);
    revalidateOperationalFinancePaths({ nightAuditRef: audit.auditNumber });
    return { success: true, audit };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function reopenNightAuditAction(
  auditNumber: string,
  reason: string
): Promise<NightAuditActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getNightAuditService();
    const audit = await service.reopenDay(ctx, session, auditNumber, reason);
    revalidateOperationalFinancePaths({ nightAuditRef: audit.auditNumber });
    return { success: true, audit };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function exportNightAuditAction(
  auditNumber: string,
  format: "CSV" | "Excel"
): Promise<NightAuditExportResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getNightAuditService();
    const audit = await service.getAuditByNumber(ctx, session, auditNumber);
    if (!audit) {
      return { success: false, error: "Night audit not found." };
    }

    const csv = buildNightAuditCsv(audit);
    const content =
      format === "Excel" ? `\uFEFF${csv.replace(/,/g, "\t")}` : csv;
    const extension = format === "Excel" ? "xls" : "csv";
    return {
      success: true,
      content,
      filename: `${audit.auditNumber}.${extension}`,
    };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
