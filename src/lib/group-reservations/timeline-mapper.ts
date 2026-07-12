import type { DbGroupTimelineEvent } from "@/types/database";
import type { GroupTimelineEvent } from "@/types/group-timeline";

export function mapDbGroupTimelineEventToGroupTimelineEvent(
  row: DbGroupTimelineEvent
): GroupTimelineEvent {
  return {
    id: row.id,
    groupReservationId: row.group_reservation_id,
    eventType: row.event_type,
    description: row.description,
    entityType: row.entity_type,
    entityId: row.entity_id,
    staffId: row.staff_id,
    staffName: row.staff_name,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}
