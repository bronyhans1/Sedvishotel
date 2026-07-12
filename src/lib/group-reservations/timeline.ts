import type { IGroupTimelineRepository } from "@/repositories/group-timeline.repository";
import type { CreateGroupTimelineEventInput } from "@/types/group-timeline";

export async function recordGroupTimelineEvent(
  timeline: IGroupTimelineRepository,
  input: CreateGroupTimelineEventInput
): Promise<void> {
  await timeline.create(input);
}
