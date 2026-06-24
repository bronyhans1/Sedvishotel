"use client";

import {
  CalendarCheck,
  Circle,
  KeyRound,
  LogIn,
  Settings,
  User,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatActivityAction } from "@/lib/activity/labels";
import { cn } from "@/lib/utils";
import { ActivityActionCodes } from "@/types/database/enums";
import type { ActivityLog } from "@/types/log";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  [ActivityActionCodes.AUTH_LOGIN]: LogIn,
  [ActivityActionCodes.PROFILE_UPDATED]: User,
  [ActivityActionCodes.PROFILE_PASSWORD_CHANGED]: KeyRound,
  [ActivityActionCodes.PROFILE_PHOTO_UPDATED]: User,
  [ActivityActionCodes.STAFF_PASSWORD_RESET]: KeyRound,
  [ActivityActionCodes.RESERVATION_CHECKED_IN]: CalendarCheck,
  [ActivityActionCodes.RESERVATION_CHECKED_OUT]: CalendarCheck,
  [ActivityActionCodes.PAYMENT_RECORDED]: Wallet,
  [ActivityActionCodes.SETTINGS_UPDATED]: Settings,
};

type Props = {
  title?: string;
  activity: ActivityLog[];
  emptyMessage?: string;
};

export function ActivityTimeline({
  title = "Recent Activities",
  activity,
  emptyMessage = "No recent activity yet.",
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ol className="space-y-0">
            {activity.map((log, index) => {
              const Icon = ICON_MAP[log.actionCode] ?? Circle;
              const isLast = index === activity.length - 1;
              const label = formatActivityAction(log.actionCode, log.action);

              return (
                <li key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast ? (
                    <span className="absolute left-[15px] top-8 h-full w-px bg-border" />
                  ) : null}
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-background">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">
                      {log.relativeTime} · {log.date} {log.time}
                    </p>
                    {log.user ? (
                      <p className={cn("mt-0.5 text-xs text-muted-foreground/80")}>
                        {log.user}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
