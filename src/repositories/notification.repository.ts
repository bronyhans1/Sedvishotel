import type { BaseRepository } from "@/repositories/base.repository";
import type { DbNotification, DbNotificationType } from "@/types/database";

export interface INotificationRepository {
  findByUser(userId: string, unreadOnly?: boolean): Promise<DbNotification[]>;
  create(
    data: Omit<DbNotification, "id" | "created_at" | "is_read" | "read_at">
  ): Promise<DbNotification>;
  markRead(id: string): Promise<DbNotification>;
  markAllRead(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
  broadcastByType(type: DbNotificationType, title: string, message: string): Promise<void>;
}

export type NotificationRepository = INotificationRepository & BaseRepository;
