import type { BaseRepository } from "@/repositories/base.repository";
import type { PaginatedResult } from "@/repositories/types";
import type { DbNotification, DbNotificationType } from "@/types/database";

/**
 * Same visibility the notification list has always used:
 * rows addressed to this user, plus broadcasts (`user_id` null).
 */
export function notificationVisibilityOr(userId: string): string {
  return `user_id.eq.${userId},user_id.is.null`;
}

export interface INotificationRepository {
  findByUser(userId: string, unreadOnly?: boolean): Promise<DbNotification[]>;
  /** All visible unread rows, newest first, plus the exact unread count. */
  listUnread(userId: string): Promise<{ rows: DbNotification[]; total: number }>;
  /** One page of visible read rows, newest first, plus the exact read count. */
  listReadPage(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<DbNotification>>;
  countUnread(userId: string): Promise<number>;
  /** Newest visible notifications, read and unread, capped for the navbar bell. */
  listRecent(userId: string, limit: number): Promise<DbNotification[]>;
  create(
    data: Omit<DbNotification, "id" | "created_at" | "is_read" | "read_at">
  ): Promise<DbNotification>;
  markRead(id: string): Promise<DbNotification>;
  markAllRead(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
  broadcastByType(type: DbNotificationType, title: string, message: string): Promise<void>;
}

export type NotificationRepository = INotificationRepository & BaseRepository;
