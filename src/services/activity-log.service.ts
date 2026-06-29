import { getLogsAccess } from "@/lib/auth/logs-access";
import {
  computeLogStats,
  mapDbActivityLogToActivityLog,
} from "@/lib/logs/mapper";
import type {
  ActivityLogFilters,
  IActivityLogRepository,
} from "@/repositories/activity-log.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import type { ActivityLog, LogStats } from "@/types/log";

export interface IActivityLogService {
  listLogs(
    ctx: ServiceContext,
    session: AuthSession,
    filters?: ActivityLogFilters
  ): Promise<{ logs: ActivityLog[]; stats: LogStats }>;
  record(
    ctx: ServiceContext,
    input: Parameters<IActivityLogRepository["create"]>[0]
  ): Promise<void>;
}

export class ActivityLogService implements IActivityLogService {
  constructor(private readonly activityLogs: IActivityLogRepository) {}

  private requireView(session: AuthSession): void {
    if (!getLogsAccess(session).canView) {
      throw new ServiceError(
        "Forbidden: activity_logs.view required.",
        "FORBIDDEN",
        403
      );
    }
  }

  async listLogs(
    _ctx: ServiceContext,
    session: AuthSession,
    filters?: ActivityLogFilters
  ) {
    if (
      filters?.userId &&
      filters.userId !== session.userId &&
      !getLogsAccess(session).canView
    ) {
      throw new ServiceError(
        "Forbidden: activity_logs.view required.",
        "FORBIDDEN",
        403
      );
    }
    if (!filters?.userId) {
      this.requireView(session);
    }

    const result = await this.activityLogs.findAll(filters, {
      page: 1,
      pageSize: 300,
    });

    return {
      logs: result.data.map(mapDbActivityLogToActivityLog),
      stats: computeLogStats(result.data),
    };
  }

  async record(
    ctx: ServiceContext,
    input: Parameters<IActivityLogRepository["create"]>[0]
  ): Promise<void> {
    await this.activityLogs.create({
      ...input,
      userId: input.userId ?? ctx.userId,
    });
  }
}
