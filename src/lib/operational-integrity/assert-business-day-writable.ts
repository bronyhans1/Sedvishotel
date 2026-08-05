import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { getBusinessDayLockService } from "@/lib/operational-integrity/get-lock-services";
import type { AuthSession } from "@/services/auth.service";
import type { ServiceContext } from "@/services/types";
import type { BusinessDayWriteOperation } from "@/types/operational-integrity";

/**
 * Shared lock gate — every write module must call this (never duplicate lock rules).
 */
export async function assertBusinessDayWritable(
  ctx: ServiceContext,
  session: AuthSession,
  input: {
    operation: BusinessDayWriteOperation;
    module: string;
    businessDate?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const businessDate =
    input.businessDate ?? (await getCurrentBusinessDate());
  const locks = await getBusinessDayLockService();
  return locks.assertWritable(ctx, session, {
    businessDate,
    operation: input.operation,
    module: input.module,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
  });
}
