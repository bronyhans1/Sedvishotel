import { Bell } from "lucide-react";

import { SHMSEmptyState } from "@/components/shared/SHMSEmptyState";

type Props = {
  className?: string;
};

export function NotificationEmptyState({ className }: Props) {
  return (
    <SHMSEmptyState
      className={className}
      icon={Bell}
      title="All caught up"
      description="Operational alerts, check-in reminders, and system notices will appear here when activity requires your attention."
    />
  );
}
