import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { IGroupTimelineRepository } from "@/repositories/group-timeline.repository";
import type { DbGroupTimelineEvent } from "@/types/database";
import type { CreateGroupTimelineEventInput } from "@/types/group-timeline";

export class SupabaseGroupTimelineRepository implements IGroupTimelineRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async listByGroup(groupId: string): Promise<DbGroupTimelineEvent[]> {
    const { data, error } = await this.client
      .from("group_timeline_events")
      .select("*")
      .eq("group_reservation_id", groupId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Failed to list group timeline: ${error.message}`);
    return data ?? [];
  }

  async create(input: CreateGroupTimelineEventInput): Promise<DbGroupTimelineEvent> {
    const { data, error } = await this.client
      .from("group_timeline_events")
      .insert({
        group_reservation_id: input.groupReservationId,
        event_type: input.eventType,
        description: input.description,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        staff_id: input.staffId ?? null,
        staff_name: input.staffName ?? null,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`Failed to create timeline event: ${error?.message ?? "unknown"}`);
    }
    return data;
  }
}
