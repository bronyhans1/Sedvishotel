"use server";

import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidateOperationalFinancePaths } from "@/lib/cache/revalidate-finance-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { buildShiftHandoverCsv } from "@/lib/shift-handover/format";
import { getShiftHandoverService } from "@/lib/shift-handover/get-shift-handover-service";
import { ServiceError } from "@/services/types";
import type { CloseShiftInput, OpenShiftInput, ShiftHandover } from "@/types/shift-handover";

export type ShiftHandoverActionResult =
  | { success: true; shift?: ShiftHandover }
  | { success: false; error: string; code?: string };

export type ShiftHandoverExportResult =
  | { success: true; content: string; filename: string }
  | { success: false; error: string };

function toActionResult(err: unknown): ShiftHandoverActionResult {
  const code = err instanceof ServiceError ? err.code : undefined;
  return {
    success: false,
    error: toSafeActionError(err),
    ...(code ? { code } : {}),
  };
}

export async function openShiftAction(
  input: OpenShiftInput
): Promise<ShiftHandoverActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getShiftHandoverService();
    const shift = await service.openShift(ctx, session, input);
    revalidateOperationalFinancePaths();
    return { success: true, shift };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function closeShiftAction(
  input: CloseShiftInput
): Promise<ShiftHandoverActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getShiftHandoverService();
    const shift = await service.closeShift(ctx, session, input);
    revalidateOperationalFinancePaths();
    return { success: true, shift };
  } catch (err) {
    unstable_rethrow(err);
    return toActionResult(err);
  }
}

export async function exportShiftHandoverAction(
  handoverNumber: string,
  format: "CSV" | "Excel"
): Promise<ShiftHandoverExportResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getShiftHandoverService();
    const shift = await service.getByNumber(ctx, session, handoverNumber);
    if (!shift) {
      return { success: false, error: "Shift handover not found." };
    }

    const csv = buildShiftHandoverCsv(shift);
    const content =
      format === "Excel" ? `\uFEFF${csv.replace(/,/g, "\t")}` : csv;
    const extension = format === "Excel" ? "xls" : "csv";
    return {
      success: true,
      content,
      filename: `${shift.handoverNumber}.${extension}`,
    };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
