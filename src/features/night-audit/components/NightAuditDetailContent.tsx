"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
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
  exportNightAuditAction,
  reopenNightAuditAction,
} from "@/features/night-audit/actions";
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
import type { NightAudit } from "@/types/night-audit";

type NightAuditDetailContentProps = {
  audit: NightAudit;
  access: NightAuditAccess;
};

export function NightAuditDetailContent({ audit, access }: NightAuditDetailContentProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [exportMsg, setExportMsg] = useState("");

  const snapshot = auditToDisplaySnapshot(audit);

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
      router.push("/dashboard/night-audit");
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

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Closing Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
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
              </p>
            ) : null}
          </CardContent>
        </Card>

        {audit.cashExpected != null ? (
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
      </div>

      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reopen business day?</DialogTitle>
            <DialogDescription>
              Admin only. Provide a reason before reopening this closed audit.
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
    </div>
  );
}
