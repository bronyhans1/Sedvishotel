"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Lock,
  LogIn,
  LogOut,
  Sparkles,
  Unlock,
  Wrench,
} from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  closeCorrectionSessionAction,
  openCorrectionSessionAction,
} from "@/features/night-audit/actions";
import { buildCountdownState } from "@/lib/night-audit/audit-window";
import { classifyNightAuditTiming } from "@/lib/night-audit/audit-window";
import type { NightAuditCommandCenter } from "@/types/operational-integrity";
import type { ReadinessTone } from "@/lib/night-audit/close-readiness";

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

const verdictStyle: Record<
  NightAuditCommandCenter["readiness"]["verdict"],
  string
> = {
  ready: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30",
  ready_with_warnings: "border-amber-300 bg-amber-50 dark:bg-amber-950/30",
  not_ready: "border-red-300 bg-red-50 dark:bg-red-950/30",
};

const verdictEmoji: Record<
  NightAuditCommandCenter["readiness"]["verdict"],
  string
> = {
  ready: "🟢",
  ready_with_warnings: "🟡",
  not_ready: "🔴",
};

const toneDot: Record<ReadinessTone, string> = {
  green: "text-emerald-600",
  yellow: "text-amber-600",
  red: "text-red-600",
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
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [now, setNow] = useState(data.wallClock);

  useEffect(() => {
    setNow(data.wallClock);
    const id = window.setInterval(() => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setNow(`${hh}:${mm}`);
    }, 1000);
    return () => window.clearInterval(id);
  }, [data.wallClock, data.businessDate]);

  const liveCountdown = useMemo(
    () =>
      buildCountdownState(
        now,
        data.auditWindow,
        data.businessDayStatus === "closed"
      ),
    [now, data.auditWindow, data.businessDayStatus]
  );

  const liveTiming = useMemo(
    () => classifyNightAuditTiming(now, data.auditWindow),
    [now, data.auditWindow]
  );

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

  const byCategory = useMemo(() => {
    const groups: Record<string, typeof data.readiness.items> = {
      financial: [],
      front_desk: [],
      housekeeping: [],
      operations: [],
      revenue: [],
    };
    for (const item of data.readiness.items) {
      groups[item.category]?.push(item);
    }
    return groups;
  }, [data.readiness.items]);

  const categoryLabels: Record<string, string> = {
    financial: "Financial",
    front_desk: "Front Desk",
    housekeeping: "Housekeeping",
    operations: "Operations",
    revenue: "Revenue",
  };

  return (
    <div className="space-y-4">
      {/* Hero: Can I Close Night Audit? */}
      <Card className={`border-2 ${verdictStyle[data.readiness.verdict]}`}>
        <CardContent className="space-y-3 pt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Can I Close Night Audit?
          </p>
          <p className="text-2xl font-semibold tracking-tight">
            {verdictEmoji[data.readiness.verdict]} {data.readiness.headline}
          </p>
          <p className="text-sm text-muted-foreground">{data.readiness.summary}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border bg-background/80 px-2 py-1">
              Business Date {data.businessDate}
            </span>
            <span className="rounded-md border bg-background/80 px-2 py-1">
              Wall clock {now}
            </span>
            <span className="rounded-md border bg-background/80 px-2 py-1">
              Window {data.auditWindow.earliestClose} →{" "}
              {data.auditWindow.recommendedClose} → {data.auditWindow.latestClose}
            </span>
            <span className="rounded-md border bg-background/80 px-2 py-1">
              Status {liveTiming.label}
            </span>
          </div>
          {data.reminderMessage && data.businessDayStatus === "open" ? (
            <p className="rounded-md border border-dashed bg-background/70 px-3 py-2 text-sm">
              Operations Assistant: {data.reminderMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Countdown */}
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Business Date</p>
            <p className="mt-1 text-lg font-semibold">{data.businessDate}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              {liveCountdown.mode === "preparing"
                ? "Recommended Night Audit"
                : liveCountdown.title}
            </p>
            <p className="mt-1 text-lg font-semibold">
              {data.auditWindow.recommendedClose}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              {liveCountdown.mode === "preparing" ? "Time Remaining" : "Elapsed"}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">
              {liveCountdown.display}
            </p>
            <p className="text-xs text-muted-foreground">{liveCountdown.statusLabel}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Operations Command Center</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Business Date {data.businessDate} · Operations Health
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Operations Health
            </p>
            <p
              className={`mt-1 text-lg font-semibold ${healthTone[data.health.status]}`}
            >
              {healthEmoji[data.health.status]} {data.health.label} ·{" "}
              {data.health.score}%
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border px-3 py-1">
              Day: {data.businessDayStatus}
            </span>
            <span className="rounded-full border px-3 py-1">
              Night Audit: {data.nightAuditStatus}
            </span>
            <span className="rounded-full border px-3 py-1">
              Timing: {liveTiming.label}
            </span>
            {data.correctionSession ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 px-3 py-1 text-amber-800 dark:text-amber-300">
                <Unlock className="h-3.5 w-3.5" />
                Correction open
              </span>
            ) : data.businessDayStatus === "closed" ? (
              <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                <Lock className="h-3.5 w-3.5" />
                Locked
              </span>
            ) : null}
          </div>

          {canManage ? (
            <div className="flex flex-wrap gap-2">
              {data.businessDayStatus === "closed" && !data.correctionSession ? (
                <Button size="sm" variant="outline" onClick={openCorrection}>
                  Open Correction Session
                </Button>
              ) : null}
              {data.correctionSession ? (
                <Button size="sm" variant="outline" onClick={closeCorrection}>
                  Close Correction Session
                </Button>
              ) : null}
            </div>
          ) : null}

          {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Expected Arrivals"
              value={String(data.expectedArrivals)}
              icon={LogIn}
            />
            <StatCard
              title="Outstanding Check-Outs"
              value={String(data.outstandingCheckOuts)}
              icon={LogOut}
            />
            <StatCard
              title="Overstay Approvals"
              value={String(data.pendingOverstayApprovals)}
              icon={Sparkles}
            />
            <StatCard
              title="Housekeeping / Maint."
              value={`${data.openHousekeepingIssues} / ${data.openMaintenanceBlocks}`}
              icon={Wrench}
            />
          </div>

          {/* Expandable readiness checklist */}
          <div className="rounded-lg border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
              onClick={() => setChecklistOpen((o) => !o)}
            >
              Readiness Checklist
              {checklistOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {checklistOpen ? (
              <div className="space-y-4 border-t px-4 py-3">
                {Object.entries(byCategory).map(([key, items]) =>
                  items.length === 0 ? null : (
                    <div key={key}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {categoryLabels[key] ?? key}
                      </p>
                      <ul className="space-y-2">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className={toneDot[item.tone]}>
                              {item.tone === "green"
                                ? "✅"
                                : item.tone === "yellow"
                                  ? "⚠"
                                  : "🔴"}
                            </span>
                            <span>
                              <span className="font-medium">{item.label}</span>
                              <span className="text-muted-foreground">
                                {" "}
                                — {item.detail}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            ) : null}
          </div>

          {data.warnings.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Operational Warnings</p>
              <ul className="space-y-2">
                {data.warnings.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <AlertTriangle
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        w.severity === "critical"
                          ? "text-red-600"
                          : w.severity === "medium"
                            ? "text-amber-600"
                            : "text-muted-foreground"
                      }`}
                    />
                    <span>
                      {w.message}{" "}
                      {w.href ? (
                        <Link href={w.href} className="underline">
                          Open
                        </Link>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> No active operational warnings
            </p>
          )}

          {data.health.factors.length > 0 ? (
            <div className="space-y-1">
              <p className="text-sm font-medium">Health contributors</p>
              <ul className="text-sm text-muted-foreground">
                {data.health.factors.map((f) => (
                  <li key={f.label}>
                    {f.label} ({f.impact})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.timeline.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Operational Timeline</p>
              <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
                {data.timeline.slice(0, 12).map((ev) => (
                  <li key={ev.id} className="flex gap-2 border-b border-dashed pb-2">
                    <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="text-muted-foreground">
                        {new Date(ev.at).toLocaleTimeString()}
                      </span>{" "}
                      {ev.label}
                      {ev.userName ? ` · ${ev.userName}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
