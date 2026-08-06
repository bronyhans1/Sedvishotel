"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  PlayCircle,
  Printer,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  closeNightAuditAction,
  exportNightAuditAction,
  reopenNightAuditAction,
} from "@/features/night-audit/actions";
import { CloseNightAuditDialog } from "@/features/night-audit/components/CloseNightAuditDialog";
import { NightAuditStatusBadge } from "@/features/night-audit/components/NightAuditStatusBadge";
import { NightAuditSummarySections } from "@/features/night-audit/components/NightAuditSummarySections";
import { useToast } from "@/hooks/use-toast";
import type { NightAuditAccess } from "@/lib/auth/night-audit-access.types";
import {
  cashVarianceClassName,
  formatSignedCurrency,
} from "@/lib/night-audit/cash-variance";
import {
  auditToDisplaySnapshot,
  formatAuditDateLabel,
  formatAuditTimeOnly,
  formatAuditTimestamp,
} from "@/lib/night-audit/format";
import { formatShiftTypeLabel } from "@/lib/shift-handover/mapper";
import { formatCurrency } from "@/lib/utils";
import type {
  NightAudit,
  NightAuditRevision,
  NightAuditSnapshot,
} from "@/types/night-audit";

type NightAuditDetailContentProps = {
  audit: NightAudit;
  access: NightAuditAccess;
  liveSnapshot: NightAuditSnapshot | null;
  revisions: NightAuditRevision[];
  isToday: boolean;
};

function revisionEventLabel(eventType: NightAuditRevision["eventType"]): string {
  switch (eventType) {
    case "closed":
      return "Closed";
    case "reopened":
      return "Reopened";
    case "reclosed":
      return "Re-closed";
    default:
      return eventType;
  }
}

export function NightAuditDetailContent({
  audit,
  access,
  liveSnapshot,
  revisions,
  isToday,
}: NightAuditDetailContentProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [closeOpen, setCloseOpen] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  const isOpen = audit.status === "open";
  const isReclose = audit.revisionNumber > 0;
  const canCloseThisAudit =
    isOpen &&
    ((isToday && access.canRunAudit) || (!isToday && access.canRecloseHistorical));

  const snapshot =
    isOpen && liveSnapshot ? liveSnapshot : auditToDisplaySnapshot(audit);

  function downloadExport(format: "CSV" | "Excel") {
    startTransition(async () => {
      const result = await exportNightAuditAction(audit.auditNumber, format);
      if (!result.success) {
        setExportMsg(result.error);
        return;
      }
      const mime =
        format === "Excel"
          ? "application/vnd.ms-excel;charset=utf-8"
          : "text/csv;charset=utf-8";
      const blob = new Blob([result.content], { type: mime });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setExportMsg(`${format} export ready.`);
      setTimeout(() => setExportMsg(""), 4000);
    });
  }

  function handlePrint() {
    window.print();
  }

  function runReopen() {
    const reason = reopenReason.trim();
    if (!reason) {
      toast.error("Reopen reason is required.");
      return;
    }
    setReopenOpen(false);
    startTransition(async () => {
      const result = await reopenNightAuditAction(audit.auditNumber, reason);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate("Business day reopened", `${audit.auditNumber} is open again.`);
      setReopenReason("");
      router.refresh();
    });
  }

  function runClose(input: {
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
    setCloseOpen(false);
    startTransition(async () => {
      const result = await closeNightAuditAction({
        ...input,
        auditDate: audit.auditDate,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate(
        isReclose ? "Night Audit Re-closed" : "Night Audit Complete",
        `${audit.auditNumber} snapshot refreshed and closed.`
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/dashboard/night-audit">
              <ArrowLeft className="h-4 w-4" />
              Back to Night Audit
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Night Audit</h1>
            <p className="font-mono text-lg text-muted-foreground">{audit.auditNumber}</p>
            <p className="text-sm text-muted-foreground">
              Date: {formatAuditDateLabel(audit.auditDate)}
              {audit.revisionNumber > 0 ? ` · Revision ${audit.revisionNumber}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NightAuditStatusBadge status={audit.status} />
          <Button variant="outline" size="sm" onClick={() => downloadExport("CSV")}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadExport("Excel")}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          {canCloseThisAudit ? (
            <Button
              size="sm"
              disabled={isPending || !liveSnapshot}
              onClick={() => setCloseOpen(true)}
            >
              <PlayCircle className="h-4 w-4" />
              {isReclose ? "Re-close Night Audit" : "Complete Night Audit"}
            </Button>
          ) : null}
          {access.canReopen && audit.status === "closed" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setReopenOpen(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Reopen Day
            </Button>
          ) : null}
        </div>
      </div>

      {exportMsg ? <p className="text-sm text-emerald-600 print:hidden">{exportMsg}</p> : null}

      {isOpen ? (
        <p className="text-sm text-muted-foreground print:hidden">
          This audit is OPEN
          {isReclose ? " for corrections" : ""}. Summary below uses live data for{" "}
          {formatAuditDateLabel(audit.auditDate)}. Closing will refresh and store a new
          snapshot revision.
        </p>
      ) : null}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Closing Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Revision: </span>
              <span className="font-medium">{audit.revisionNumber}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Status: </span>
              <span className="font-medium capitalize">{audit.status}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Closed By: </span>
              <span className="font-medium">{audit.closedByName ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Closed At: </span>
              <span className="font-medium">
                {audit.closedAt ? formatAuditTimeOnly(audit.closedAt) : "—"}
              </span>
            </p>
            {audit.shiftHandoverNumber ? (
              <>
                <p>
                  <span className="text-muted-foreground">Closed During Shift: </span>
                  <span className="font-medium">
                    {audit.shiftType ? formatShiftTypeLabel(audit.shiftType) : "—"}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Shift Number: </span>
                  <span className="font-mono font-medium">{audit.shiftHandoverNumber}</span>
                </p>
              </>
            ) : null}
            {audit.closedAt ? (
              <p className="sm:col-span-2 text-muted-foreground">
                {formatAuditTimestamp(audit.closedAt)}
              </p>
            ) : null}
            {audit.notes ? (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Notes: </span>
                <span className="font-medium">{audit.notes}</span>
              </p>
            ) : null}
            {audit.reopenReason ? (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Reopen reason: </span>
                <span className="font-medium">{audit.reopenReason}</span>
                {audit.reopenedByName || audit.reopenedAt ? (
                  <span className="text-muted-foreground">
                    {" "}
                    (
                    {[audit.reopenedByName, audit.reopenedAt ? formatAuditTimestamp(audit.reopenedAt) : null]
                      .filter(Boolean)
                      .join(" · ")}
                    )
                  </span>
                ) : null}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {audit.cashExpected != null && !isOpen ? (
          <Card>
            <CardHeader>
              <CardTitle>Cash Variance</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
              <p>
                <span className="text-muted-foreground">Expected Cash: </span>
                <span className="font-medium">{formatCurrency(audit.cashExpected)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Counted Cash: </span>
                <span className="font-medium">
                  {audit.cashCounted != null ? formatCurrency(audit.cashCounted) : "—"}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Variance: </span>
                <span
                  className={`font-semibold ${
                    audit.cashVariance != null
                      ? cashVarianceClassName(audit.cashVariance)
                      : ""
                  }`}
                >
                  {audit.cashVariance != null
                    ? formatSignedCurrency(audit.cashVariance)
                    : "—"}
                </span>
              </p>
              {audit.varianceNotes ? (
                <p className="sm:col-span-3">
                  <span className="text-muted-foreground">Notes: </span>
                  <span className="font-medium">{audit.varianceNotes}</span>
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <NightAuditSummarySections snapshot={snapshot} />

        {access.canViewRevisions ? (
          <Card>
            <CardHeader>
              <CardTitle>Revision History</CardTitle>
            </CardHeader>
            <CardContent>
              {revisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No revision events yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 font-semibold">Rev</th>
                        <th className="px-3 py-2 font-semibold">Event</th>
                        <th className="px-3 py-2 font-semibold">When</th>
                        <th className="px-3 py-2 font-semibold">By</th>
                        <th className="px-3 py-2 font-semibold">Net Revenue</th>
                        <th className="px-3 py-2 font-semibold">Reason / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {revisions.map((rev) => (
                        <tr key={rev.id}>
                          <td className="px-3 py-2 font-mono">{rev.revisionNumber}</td>
                          <td className="px-3 py-2">{revisionEventLabel(rev.eventType)}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {formatAuditTimestamp(
                              rev.eventType === "reopened"
                                ? rev.reopenedAt
                                : rev.closedAt ?? rev.createdAt
                            )}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {rev.eventType === "reopened"
                              ? rev.reopenedByName ?? "—"
                              : rev.closedByName ?? "—"}
                          </td>
                          <td className="px-3 py-2">
                            {rev.netRevenue != null
                              ? formatCurrency(rev.netRevenue)
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {rev.reopenReason ?? rev.notes ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reopen business day?</DialogTitle>
            <DialogDescription>
              Admin only. Provide a reason before reopening this closed audit. Only one
              OPEN audit is allowed at a time.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="Explain why this business day must be reopened…"
            rows={3}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReopenOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={runReopen}
            >
              Reopen Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {liveSnapshot ? (
        <CloseNightAuditDialog
          open={closeOpen}
          onOpenChange={setCloseOpen}
          expectedCash={liveSnapshot.cashTotal}
          auditDateLabel={formatAuditDateLabel(audit.auditDate)}
          isReclose={isReclose}
          loading={isPending}
          canManagerOverride={access.canManagerOverride}
          onConfirm={runClose}
        />
      ) : null}
    </div>
  );
}
