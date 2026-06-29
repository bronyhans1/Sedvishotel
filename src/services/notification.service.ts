import { getNotificationsAccess } from "@/lib/auth/notifications-access";
import { mapDbNotificationToNotification } from "@/lib/notifications/mapper";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { INotificationRepository } from "@/repositories/notification.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { Notification } from "@/types/notification";

export interface INotificationService {
  listNotifications(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<Notification[]>;
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
