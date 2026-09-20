import type { DbGroupTimelineEvent } from "@/types/database";
import type { CreateGroupTimelineEventInput } from "@/types/group-timeline";

export interface IGroupTimelineRepository {
  listByGroup(groupId: string): Promise<DbGroupTimelineEvent[]>;
  /** Batched list for dashboard N+1 elimination. Empty ids → []. */
  listByGroupIds(groupIds: string[]): Promise<DbGroupTimelineEvent[]>;
  create(input: CreateGroupTimelineEventInput): Promise<DbGroupTimelineEvent>;
}
