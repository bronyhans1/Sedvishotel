import type { INotificationRepository } from "@/repositories/notification.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbNotification, DbNotificationType } from "@/types/database";

export class SupabaseNotificationRepository implements INotificationRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async findByUser(userId: string, unreadOnly = false): Promise<DbNotification[]> {
    let query = this.client
      .from("notifications")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`)
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
      .or(`user_id.eq.${userId},user_id.is.null`)
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
