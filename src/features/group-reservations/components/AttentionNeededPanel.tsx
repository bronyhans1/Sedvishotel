"use client";

import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SmartAlert, SmartAlertAction } from "@/types/group-operational-intelligence";

const ACTION_LABELS: Record<SmartAlertAction, string> = {
  assign_rooms: "Assign Rooms",
  open_master_folio: "Open Master Folio",
  collect_deposit: "Collect Deposit",
  view_blocks: "View Blocks",
  resolve_issue: "Resolve Issue",
  view_timeline: "View Timeline",
  record_payment: "Record Payment",
  view_company: "View Company",
  bulk_check_in: "Bulk Check-In",
  bulk_check_out: "Bulk Check-Out",
  view_reservations: "View Reservations",
};

const SEVERITY_STYLES = {
  critical: {
    icon: AlertCircle,
    badge: "destructive" as const,
    border: "border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/30",
  },
  warning: {
    icon: AlertTriangle,
    badge: "secondary" as const,
    border: "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30",
  },
  information: {
    icon: Info,
    badge: "outline" as const,
    border: "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30",
  },
};

type Props = {
  alerts: SmartAlert[];
  groupId: string;
  onTabChange?: (tab: string) => void;
};

export function AttentionNeededPanel({ alerts, groupId, onTabChange }: Props) {
  if (alerts.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-300">All clear</p>
            <p className="text-sm text-muted-foreground">No operational alerts require attention.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;

  return (
    <Card className="border-amber-300/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Attention Needed
          </CardTitle>
          <div className="flex gap-2">
            {critical > 0 && (
              <Badge variant="destructive">{critical} Critical</Badge>
            )}
            {warning > 0 && (
              <Badge variant="secondary">{warning} Warning</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((item) => {
          const style = SEVERITY_STYLES[item.severity];
          const Icon = style.icon;
          const href =
            item.href ??
            (item.tab ? `/dashboard/group-reservations/${groupId}?tab=${item.tab}` : undefined);

          return (
            <div
              key={item.id}
              className={cn(
                "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
                style.border
              )}
            >
              <div className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={style.badge} className="capitalize">
                      {item.severity}
                    </Badge>
                    <p className="font-medium">{item.message}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.suggestedAction}
                  </p>
                </div>
              </div>
              {item.action && href && (
                <Button size="sm" variant="outline" asChild className="shrink-0">
                  <Link
                    href={href}
                    onClick={() => item.tab && onTabChange?.(item.tab)}
                  >
                    {ACTION_LABELS[item.action]}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
