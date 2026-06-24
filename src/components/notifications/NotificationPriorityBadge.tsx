import { Badge } from "@/components/ui/badge";
import type { NotificationPriority } from "@/types/notification";

const styles: Record<NotificationPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  high: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  critical: "bg-red-500/15 text-red-700 dark:text-red-400",
};

export function NotificationPriorityBadge({
  priority,
}: {
  priority: NotificationPriority;
}) {
  return (
    <Badge variant="secondary" className={styles[priority]}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}
