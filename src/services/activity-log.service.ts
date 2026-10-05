import { getLogsAccess } from "@/lib/auth/logs-access";
import {
  computeLogStats,
  mapDbActivityLogToActivityLog,
} from "@/lib/logs/mapper";
import { utcActivityLogDayWindow } from "@/lib/logs/utc-day";
import { OPERATIONAL_LIST_PAGE_SIZE } from "@/lib/pagination/constants";
import { getTotalPages, normalizePage } from "@/lib/pagination/pagination";
import type {
  ActivityLogFilters,
  IActivityLogRepository,
} from "@/repositories/activity-log.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import type { ActivityLog, LogStats } from "@/types/log";

export type ActivityLogPage = {
  logs: ActivityLog[];
  stats: LogStats;
  page: number;
  pageSize: number;
  total: number;
  search: string;
};

export interface IActivityLogService {
  listLogs(
    ctx: ServiceContext,
    session: AuthSession,
    filters?: ActivityLogFilters
  ): Promise<{ logs: ActivityLog[]; stats: LogStats }>;
  listLogPage(
    ctx: ServiceContext,
    session: AuthSession,
    input: { page: number; search?: string }
  ): Promise<ActivityLogPage>;
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

  /**
   * Activity Logs page. The table is one server page. KPI cards count the
   * full UTC calendar day and ignore page and search.
   */
  async listLogPage(
    _ctx: ServiceContext,
    session: AuthSession,
    input: { page: number; search?: string }
  ): Promise<ActivityLogPage> {
    this.requireView(session);

    const pageSize = OPERATIONAL_LIST_PAGE_SIZE;
    const search = input.search?.trim() ?? "";
    const filters: ActivityLogFilters | undefined = search ? { search } : undefined;
    const today = utcActivityLogDayWindow().day;

    const [result, stats] = await Promise.all([
      this.activityLogs.findAll(filters, {
        page: input.page,
        pageSize,
      }),
      this.activityLogs.countUtcCalendarDay(today),
    ]);

    const page = normalizePage(input.page, getTotalPages(result.total, pageSize));

    return {
      logs:
        page === input.page
          ? result.data.map(mapDbActivityLogToActivityLog)
          : [],
      stats,
      page,
      pageSize,
      total: result.total,
      search,
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
