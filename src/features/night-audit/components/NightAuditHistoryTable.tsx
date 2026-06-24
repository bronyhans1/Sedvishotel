import Link from "next/link";
import { Eye } from "lucide-react";

import { NightAuditStatusBadge } from "@/features/night-audit/components/NightAuditStatusBadge";
import { formatAuditDateLabel, formatAuditTimestamp } from "@/lib/night-audit/format";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { NightAudit } from "@/types/night-audit";

type NightAuditHistoryTableProps = {
  audits: NightAudit[];
};

export function NightAuditHistoryTable({ audits }: NightAuditHistoryTableProps) {
  if (audits.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
        No night audit history yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-semibold">Audit Number</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Net Revenue</th>
              <th className="px-4 py-3 font-semibold">Closed By</th>
              <th className="px-4 py-3 font-semibold">Closed At</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {audits.map((audit) => (
              <tr key={audit.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-medium">{audit.auditNumber}</td>
                <td className="px-4 py-3">{formatAuditDateLabel(audit.auditDate)}</td>
                <td className="px-4 py-3">
                  <NightAuditStatusBadge status={audit.status} />
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(audit.netRevenue)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {audit.closedByName ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {audit.closedAt ? formatAuditTimestamp(audit.closedAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/night-audit/${encodeURIComponent(audit.auditNumber)}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">View</span>
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
