"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Lock,
  Unlock,
} from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  closeCorrectionSessionAction,
  openCorrectionSessionAction,
} from "@/features/night-audit/actions";
import type { NightAuditCommandCenter } from "@/types/operational-integrity";

const healthTone: Record<
  NightAuditCommandCenter["health"]["status"],
  string
> = {
  healthy: "text-emerald-700 dark:text-emerald-400",
  attention: "text-amber-700 dark:text-amber-400",
  action_required: "text-red-700 dark:text-red-400",
};

const healthEmoji: Record<NightAuditCommandCenter["health"]["status"], string> =
  {
    healthy: "🟢",
    attention: "🟡",
    action_required: "🔴",
  };

type Props = {
  data: NightAuditCommandCenter;
  canManage: boolean;
  onRefresh: () => void;
};

export function NightAuditCommandCenterPanel({
  data,
  canManage,
  onRefresh,
}: Props) {
  const [, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  function openCorrection() {
    const reason = window.prompt("Reason for Correction Session") ?? "";
    if (!reason.trim()) return;
    startTransition(async () => {
      const result = await openCorrectionSessionAction(
        data.businessDate,
        reason
      );
      setMsg(result.success ? "Correction session opened." : result.error);
      onRefresh();
    });
  }

  function closeCorrection() {
    if (!data.correctionSession) return;
    startTransition(async () => {
      const result = await closeCorrectionSessionAction(
        data.correctionSession!.id
      );
      setMsg(result.success ? "Correction session closed." : result.error);
      onRefresh();
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Operational Command Center</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Business Date {data.businessDate}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Business Day Health
            </p>
            <p
              className={`mt-1 text-lg font-semibold ${healthTone[data.health.status]}`}
            >
              {healthEmoji[data.health.status]} {data.health.label} ·{" "}
              {data.health.score}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border px-3 py-1">
              Day:{" "}
              <strong>
                {data.businessDayStatus === "closed" ? "Locked / Closed" : "Open"}
              </strong>
            </span>
            <span className="rounded-full border px-3 py-1">
              Night Audit: <strong>{data.nightAuditStatus}</strong>
            </span>
            <span className="rounded-full border px-3 py-1">
              Correction:{" "}
              <strong>
                {data.correctionSession
                  ? `${data.correctionSession.sessionNumber} (${data.correctionSession.status})`
                  : "None"}
              </strong>
            </span>
          </div>

          {canManage ? (
            <div className="flex flex-wrap gap-2">
              {data.businessDayStatus === "closed" &&
              !data.correctionSession ? (
                <Button size="sm" variant="outline" onClick={openCorrection}>
                  <Unlock className="h-4 w-4" />
                  Open Correction Session
                </Button>
              ) : null}
              {data.correctionSession ? (
                <Button size="sm" variant="secondary" onClick={closeCorrection}>
                  <Lock className="h-4 w-4" />
                  Re-close Correction Session
                </Button>
              ) : null}
            </div>
          ) : null}

          {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending Overstay Approvals"
          value={data.pendingOverstayApprovals}
          icon={AlertTriangle}
        />
        <StatCard
          title="Outstanding Check-Outs"
          value={data.outstandingCheckOuts}
          icon={Clock3}
        />
        <StatCard
          title="Expected Arrivals"
          value={data.expectedArrivals}
          icon={CheckCircle2}
        />
        <StatCard
          title="Maintenance / HK"
          value={`${data.openMaintenanceBlocks} / ${data.openHousekeepingIssues}`}
          icon={AlertTriangle}
        />
      </div>

      {data.warnings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Smart Warnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.warnings.map((w) => (
              <div
                key={w.id}
                className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
              >
                <p>
                  <span className="mr-2 text-xs uppercase text-muted-foreground">
                    {w.severity}
                  </span>
                  {w.message}
                </p>
                {w.href ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={w.href}>Open</Link>
                  </Button>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {data.health.factors.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health Factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {data.health.factors.map((f) => (
              <p key={f.label} className="text-muted-foreground">
                {f.label}{" "}
                <span className="font-medium text-foreground">{f.impact}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operational Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity logged for this business date window yet.
            </p>
          ) : (
            data.timeline.map((e) => (
              <div key={e.id} className="border-l-2 border-border pl-3 text-sm">
                <p className="font-medium">{e.label}</p>
                <p className="text-xs text-muted-foreground">
                  {e.at.slice(0, 16).replace("T", " ")}
                  {e.userName ? ` · ${e.userName}` : ""} · {e.module}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
