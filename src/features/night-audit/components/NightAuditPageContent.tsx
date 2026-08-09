"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Moon, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { closeNightAuditAction } from "@/features/night-audit/actions";
import { CloseNightAuditDialog } from "@/features/night-audit/components/CloseNightAuditDialog";
import { NightAuditCommandCenterPanel } from "@/features/night-audit/components/NightAuditCommandCenterPanel";
import { NightAuditHistoryTable } from "@/features/night-audit/components/NightAuditHistoryTable";
import { NightAuditStatusBadge } from "@/features/night-audit/components/NightAuditStatusBadge";
import { NightAuditSummarySections } from "@/features/night-audit/components/NightAuditSummarySections";
import { useToast } from "@/hooks/use-toast";
import type { NightAuditAccess } from "@/lib/auth/night-audit-access.types";
import { getCalendarDateString } from "@/lib/dates/today";
import { classifyNightAuditTiming } from "@/lib/night-audit/audit-window";
import {
  auditToDisplaySnapshot,
  formatAuditDateLabel,
} from "@/lib/night-audit/format";
import { siteConfig } from "@/config/site";
import type { NightAudit, NightAuditSnapshot } from "@/types/night-audit";
import type { NightAuditCommandCenter } from "@/types/operational-integrity";
import type { OverstayNightAuditWarning } from "@/types/overstay";

type NightAuditPageContentProps = {
  businessDate: string;
  currentAudit: NightAudit | null;
  blockedByOpenAudit: NightAudit | null;
  liveSnapshot: NightAuditSnapshot | null;
  history: NightAudit[];
  access: NightAuditAccess;
  overstayWarning?: OverstayNightAuditWarning | null;
  commandCenter?: NightAuditCommandCenter | null;
};

export function NightAuditPageContent({
  businessDate,
  currentAudit,
  blockedByOpenAudit,
  liveSnapshot,
  history,
  access,
  overstayWarning,
  commandCenter,
}: NightAuditPageContentProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [wallClock, setWallClock] = useState(
    commandCenter?.wallClock ?? "00:00"
  );

  useEffect(() => {
    if (commandCenter?.wallClock) setWallClock(commandCenter.wallClock);
    const id = window.setInterval(() => {
      const d = new Date();
      setWallClock(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, [commandCenter?.wallClock]);

  const isBlocked = Boolean(blockedByOpenAudit);
  const isClosed = currentAudit?.status === "closed";
  const canCloseToday =
    access.canRunAudit && currentAudit?.status === "open" && !isBlocked;

  const closeBusinessDateShort = currentAudit
    ? (() => {
        const d = new Date(`${currentAudit.auditDate}T12:00:00`);
        return Number.isNaN(d.getTime())
          ? currentAudit.auditDate
          : new Intl.DateTimeFormat(undefined, {
              month: "short",
              day: "numeric",
            }).format(d);
      })()
    : null;
  const primaryCloseLabel = closeBusinessDateShort
    ? `Run Night Audit · Close ${closeBusinessDateShort}`
    : "Close Current Business Day";

  const liveCloseTiming = useMemo(() => {
    if (!commandCenter || !currentAudit) return commandCenter?.timing ?? null;
    return classifyNightAuditTiming(wallClock, commandCenter.auditWindow, {
      businessDate: currentAudit.auditDate,
      calendarDate: getCalendarDateString(),
    });
  }, [commandCenter, currentAudit, wallClock]);

  const displaySnapshot =
    currentAudit && isClosed
      ? auditToDisplaySnapshot(currentAudit)
      : liveSnapshot;

  function runNightAudit(input: {
    cashCounted: number;
    notes?: string;
    varianceNotes?: string;
    overstayAcknowledged?: boolean;
    managerOverride?: boolean;
    overrideReason?: string;
    closeClassification?: import("@/lib/night-audit/audit-window").NightAuditCloseClassification;
    closeWallClock?: string;
    delayMinutes?: number;
  }) {
    if (!currentAudit) return;
    setConfirmOpen(false);
    startTransition(async () => {
      const result = await closeNightAuditAction({
        ...input,
        auditDate: currentAudit.auditDate,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate(
        "Night Audit Complete",
        "Business day closed. Operational date advanced."
      );
      router.refresh();
    });
  }

  return (
    <PageContainer
      title="Night Audit"
      description={`End-of-day closing and daily snapshots for ${siteConfig.name}.`}
      actions={
        canCloseToday ? (
          <Button size="sm" disabled={isPending} onClick={() => setConfirmOpen(true)}>
            <PlayCircle className="h-4 w-4" />
            <span className="max-w-[14rem] truncate sm:max-w-none">
              {primaryCloseLabel}
            </span>
          </Button>
        ) : undefined
      }
    >
      {blockedByOpenAudit ? (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-900 dark:text-amber-100">
              <AlertTriangle className="h-5 w-5" />
              Another business day is still OPEN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
            <p>
              Only one Night Audit may be OPEN. Close{" "}
              <span className="font-mono font-medium">
                {blockedByOpenAudit.auditNumber}
              </span>{" "}
              ({formatAuditDateLabel(blockedByOpenAudit.auditDate)}) before opening{" "}
              {formatAuditDateLabel(businessDate)}.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/dashboard/night-audit/${encodeURIComponent(blockedByOpenAudit.auditNumber)}`}
              >
                Open {blockedByOpenAudit.auditNumber}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {currentAudit ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Current Business Day
              </CardTitle>
              <p className="mt-1 font-mono text-sm">{currentAudit.auditNumber}</p>
              <p className="text-sm text-muted-foreground">
                {formatAuditDateLabel(businessDate)}
                {currentAudit.revisionNumber > 0
                  ? ` · Revision ${currentAudit.revisionNumber}`
                  : null}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Day Status
              </p>
              <div className="mt-1">
                <NightAuditStatusBadge status={currentAudit.status} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isClosed ? (
              <p className="text-sm text-muted-foreground">
                This business day is closed.{" "}
                <Link
                  href={`/dashboard/night-audit/${encodeURIComponent(currentAudit.auditNumber)}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  View snapshot
                </Link>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Operating on Business Date {formatAuditDateLabel(businessDate)}.
                The next Night Audit will close this day — it is separate from any
                audit you already completed for a previous Business Date.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {commandCenter ? (
        <NightAuditCommandCenterPanel
          data={commandCenter}
          canManage={access.canReopen}
          onRefresh={() => {
            startTransition(() => {
              router.refresh();
            });
          }}
        />
      ) : null}

      {displaySnapshot ? <NightAuditSummarySections snapshot={displaySnapshot} /> : null}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Audit History</h2>
        <NightAuditHistoryTable audits={history} />
      </div>

      {liveSnapshot && currentAudit ? (
        <CloseNightAuditDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          expectedCash={liveSnapshot.cashTotal}
          auditDateLabel={formatAuditDateLabel(currentAudit.auditDate)}
          isReclose={currentAudit.revisionNumber > 0}
          confirmLabel={primaryCloseLabel}
          loading={isPending}
          overstayWarning={overstayWarning}
          timing={liveCloseTiming}
          canManagerOverride={access.canManagerOverride}
          onConfirm={runNightAudit}
        />
      ) : null}
    </PageContainer>
  );
}
