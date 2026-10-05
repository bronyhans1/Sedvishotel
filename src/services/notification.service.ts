import { getNotificationsAccess } from "@/lib/auth/notifications-access";
import { mapDbNotificationToNotification } from "@/lib/notifications/mapper";
import { OPERATIONAL_LIST_PAGE_SIZE } from "@/lib/pagination/constants";
import { getTotalPages, normalizePage } from "@/lib/pagination/pagination";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { INotificationRepository } from "@/repositories/notification.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { Notification, NotificationBellData } from "@/types/notification";

/** Newest notifications shown in the navbar bell. Not a page of read history. */
export const NOTIFICATION_BELL_PREVIEW_LIMIT = 8;

export type NotificationPage = {
  unreadNotifications: Notification[];
  unreadCount: number;
  readNotifications: Notification[];
  readTotal: number;
  readPage: number;
  readPageSize: number;
};

export interface INotificationService {
  listNotifications(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<Notification[]>;
  listNotificationPage(
    ctx: ServiceContext,
    session: AuthSession,
    input: { page: number }
  ): Promise<NotificationPage>;
  listNotificationBell(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<NotificationBellData>;
  markRead(ctx: ServiceContext, session: AuthSession, id: string): Promise<void>;
  markAllRead(ctx: ServiceContext, session: AuthSession): Promise<void>;
  deleteNotification(ctx: ServiceContext, session: AuthSession, id: string): Promise<void>;
}

export class NotificationService implements INotificationService {
  constructor(
    private readonly notifications: INotificationRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private requireView(session: AuthSession): void {
    if (!getNotificationsAccess(session).canView) {
      throw new ServiceError(
        "Forbidden: notifications.view required.",
        "FORBIDDEN",
        403
      );
    }
  }

  async listNotifications(ctx: ServiceContext, session: AuthSession) {
    this.requireView(session);
    const rows = await this.notifications.findByUser(ctx.userId);
    return rows.map(mapDbNotificationToNotification);
  }

  async listNotificationPage(
    ctx: ServiceContext,
    session: AuthSession,
    input: { page: number }
  ): Promise<NotificationPage> {
    this.requireView(session);
    const pageSize = OPERATIONAL_LIST_PAGE_SIZE;
    const [unread, read] = await Promise.all([
      this.notifications.listUnread(ctx.userId),
      this.notifications.listReadPage(ctx.userId, input.page, pageSize),
    ]);
    const readPage = normalizePage(input.page, getTotalPages(read.total, pageSize));

    return {
      unreadNotifications: unread.rows.map(mapDbNotificationToNotification),
      unreadCount: unread.total,
      readNotifications:
        readPage === input.page
          ? read.data.map(mapDbNotificationToNotification)
          : [],
      readTotal: read.total,
      readPage,
      readPageSize: pageSize,
    };
  }

  async listNotificationBell(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<NotificationBellData> {
    this.requireView(session);
    const [rows, unreadCount] = await Promise.all([
      this.notifications.listRecent(ctx.userId, NOTIFICATION_BELL_PREVIEW_LIMIT),
      this.notifications.countUnread(ctx.userId),
    ]);
    return {
      preview: rows.map(mapDbNotificationToNotification),
      unreadCount,
    };
  }

  async markRead(ctx: ServiceContext, session: AuthSession, id: string) {
    this.requireView(session);
    await this.notifications.markRead(id);

    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: "Marked notification as read",
      actionCode: ActivityActionCodes.NOTIFICATION_READ,
      module: "notifications",
      entityType: "notification",
      entityId: id,
    });
  }

  async markAllRead(ctx: ServiceContext, session: AuthSession) {
    this.requireView(session);
    await this.notifications.markAllRead(ctx.userId);

    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: "Marked all notifications as read",
      actionCode: ActivityActionCodes.NOTIFICATION_READ_ALL,
      module: "notifications",
    });
  }

  async deleteNotification(ctx: ServiceContext, session: AuthSession, id: string) {
    this.requireView(session);
    await this.notifications.delete(id);

    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: "Deleted notification",
      actionCode: ActivityActionCodes.NOTIFICATION_READ,
      module: "notifications",
      entityType: "notification",
      entityId: id,
    });
  }
}
