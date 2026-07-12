"use client";

import { Activity, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GroupHealthScore } from "@/types/group-operational-intelligence";

const STATUS_CONFIG = {
  healthy: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  attention: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  critical: {
    icon: XCircle,
    color: "text-rose-600",
    bg: "bg-rose-500",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
};

type Props = {
  health: GroupHealthScore;
};

export function GroupHealthWidget({ health }: Props) {
  const config = STATUS_CONFIG[health.status];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Group Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-full", config.badge)}>
            <Icon className={cn("h-7 w-7", config.color)} />
          </div>
          <div>
            <p className="text-2xl font-bold">{health.score}%</p>
            <Badge className={cn("mt-1 border-0", config.badge)}>{health.label}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Health score</span>
            <span>{health.score}/100</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", config.bg)}
              style={{ width: `${health.score}%` }}
            />
          </div>
        </div>

        {health.factors.length > 0 && (
          <div className="space-y-1 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">Contributing factors</p>
            {health.factors.slice(0, 4).map((f) => (
              <div key={f.label} className="flex justify-between text-xs">
                <span>{f.label}</span>
                <span className="text-muted-foreground">{f.impact}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
