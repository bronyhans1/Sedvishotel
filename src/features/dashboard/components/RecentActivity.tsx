import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardActivityItem } from "@/types/dashboard-home";

const actionStatusMap = {
  "Check-in": "occupied",
  "Check-out": "available",
  Reservation: "reserved",
} as const;

type Props = {
  items: DashboardActivityItem[];
};

export function RecentActivity({ items }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.guest}</p>
                  <p className="text-sm text-muted-foreground">
                    Room {item.room} · {item.time}
                  </p>
                </div>
                <StatusBadge
                  status={
                    actionStatusMap[
                      item.action as keyof typeof actionStatusMap
                    ] ?? "operational"
                  }
                  label={item.action}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
