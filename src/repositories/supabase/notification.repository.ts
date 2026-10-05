import {
  notificationVisibilityOr,
  type INotificationRepository,
} from "@/repositories/notification.repository";
import type { PaginatedResult } from "@/repositories/types";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbNotification, DbNotificationType } from "@/types/database";

/**
 * PostgREST returns at most 1000 rows per request. Unread is fetched in
 * batches of this size until the exact unread count is collected, so the
 * batch size is a transport limit and not a visibility cap.
 */
const UNREAD_FETCH_BATCH = 1000;

export class SupabaseNotificationRepository implements INotificationRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async findByUser(userId: string, unreadOnly = false): Promise<DbNotification[]> {
    let query = this.client
      .from("notifications")
      .select("*")
      .or(notificationVisibilityOr(userId))
      .order("created_at", { ascending: false })
      .limit(200);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to load notifications: ${error.message}`);
    }

    return data ?? [];
  }

  async listUnread(userId: string): Promise<{ rows: DbNotification[]; total: number }> {
    const total = await this.countVisible(userId, false);
    if (total === 0) return { rows: [], total: 0 };

    const rows: DbNotification[] = [];
    for (let offset = 0; offset < total; offset += UNREAD_FETCH_BATCH) {
      const end = Math.min(offset + UNREAD_FETCH_BATCH, total) - 1;
      const { data, error } = await this.client
        .from("notifications")
        .select("*")
        .or(notificationVisibilityOr(userId))
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .range(offset, end);

      if (error) {
        throw new Error(`Failed to load unread notifications: ${error.message}`);
      }

      const batch = data ?? [];
      rows.push(...batch);
      if (batch.length === 0) break;
    }

    return { rows, total };
  }

  async listReadPage(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<DbNotification>> {
    const safePage = page > 0 ? Math.floor(page) : 1;
    const safeSize = pageSize > 0 ? Math.floor(pageSize) : 25;
    const from = (safePage - 1) * safeSize;
    const to = from + safeSize - 1;

    const { data, error, count } = await this.client
      .from("notifications")
      .select("*", { count: "exact" })
      .or(notificationVisibilityOr(userId))
      .eq("is_read", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to load read notifications: ${error.message}`);
    }

    return {
      data: data ?? [],
      total: count ?? 0,
      page: safePage,
      pageSize: safeSize,
    };
  }

  async countUnread(userId: string): Promise<number> {
    return this.countVisible(userId, false);
  }

  async listRecent(userId: string, limit: number): Promise<DbNotification[]> {
    const cap = limit > 0 ? Math.floor(limit) : 8;
    const { data, error } = await this.client
      .from("notifications")
      .select("*")
      .or(notificationVisibilityOr(userId))
      .order("created_at", { ascending: false })
      .limit(cap);

    if (error) {
      throw new Error(`Failed to load recent notifications: ${error.message}`);
    }

    return data ?? [];
  }

  private async countVisible(userId: string, isRead: boolean): Promise<number> {
    const { count, error } = await this.client
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .or(notificationVisibilityOr(userId))
      .eq("is_read", isRead);

    if (error) {
      throw new Error(`Failed to count notifications: ${error.message}`);
    }

    return count ?? 0;
  }

  async create(
    data: Omit<DbNotification, "id" | "created_at" | "is_read" | "read_at">
  ): Promise<DbNotification> {
    const { data: row, error } = await this.client
      .from("notifications")
      .insert({
        ...data,
        is_read: false,
        read_at: null,
      })
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to create notification: ${error?.message}`);
    }

    return row;
  }

  async markRead(id: string): Promise<DbNotification> {
    const { data, error } = await this.client
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to mark notification read: ${error?.message}`);
    }

    return data;
  }

  async markAllRead(userId: string): Promise<void> {
    const { error } = await this.client
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .or(notificationVisibilityOr(userId))
      .eq("is_read", false);

    if (error) {
      throw new Error(`Failed to mark all notifications read: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("notifications").delete().eq("id", id);
    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  async broadcastByType(
    type: DbNotificationType,
    title: string,
    message: string
  ): Promise<void> {
    const { error } = await this.client.from("notifications").insert({
      user_id: null,
      title,
      message,
      type,
      priority: "medium",
      module: "system",
      entity_type: null,
      entity_id: null,
      is_read: false,
      read_at: null,
      metadata: {},
    });

    if (error) {
      throw new Error(`Failed to broadcast notification: ${error.message}`);
    }
  }
}
