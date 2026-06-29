"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Moon, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { closeNightAuditAction } from "@/features/night-audit/actions";
import { CloseNightAuditDialog } from "@/features/night-audit/components/CloseNightAuditDialog";
import { NightAuditHistoryTable } from "@/features/night-audit/components/NightAuditHistoryTable";
import { NightAuditStatusBadge } from "@/features/night-audit/components/NightAuditStatusBadge";
import { NightAuditSummarySections } from "@/features/night-audit/components/NightAuditSummarySections";
import { useToast } from "@/hooks/use-toast";
import type { NightAuditAccess } from "@/lib/auth/night-audit-access.types";
import {
  auditToDisplaySnapshot,
  formatAuditDateLabel,
} from "@/lib/night-audit/format";
import { siteConfig } from "@/config/site";
import type { NightAudit, NightAuditSnapshot } from "@/types/night-audit";

type NightAuditPageContentProps = {
  businessDate: string;
  currentAudit: NightAudit;
  liveSnapshot: NightAuditSnapshot;
  history: NightAudit[];
  access: NightAuditAccess;
};

export function NightAuditPageContent({
  businessDate,
  currentAudit,
  liveSnapshot,
  history,
  access,
}: NightAuditPageContentProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isClosed = currentAudit.status === "closed";
  const displaySnapshot = isClosed
    ? auditToDisplaySnapshot(currentAudit)
    : liveSnapshot;

  function runNightAudit(input: {
    cashCounted: number;
    notes?: string;
    varianceNotes?: string;
  }) {
    setConfirmOpen(false);
    startTransition(async () => {
      const result = await closeNightAuditAction(input);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate("Night Audit Complete", "Night Audit completed successfully.");
      router.refresh();
    });
  }

  return (
    <PageContainer
      title="Night Audit"
      description={`End-of-day closing and daily snapshots for ${siteConfig.name}.`}
      actions={
        access.canRunAudit && !isClosed ? (
          <Button size="sm" disabled={isPending} onClick={() => setConfirmOpen(true)}>
            <PlayCircle className="h-4 w-4" />
            Run Night Audit
          </Button>
        ) : undefined
      }
    >
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
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Audit Status</p>
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
              Live operational and financial data for today. Run night audit to lock this day and
              preserve an immutable snapshot.
            </p>
          )}
        </CardContent>
      </Card>

      <NightAuditSummarySections snapshot={displaySnapshot} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Audit History</h2>
        <NightAuditHistoryTable audits={history} />
      </div>

      <CloseNightAuditDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        expectedCash={liveSnapshot.cashTotal}
        loading={isPending}
        onConfirm={runNightAudit}
      />
    </PageContainer>
  );
}
