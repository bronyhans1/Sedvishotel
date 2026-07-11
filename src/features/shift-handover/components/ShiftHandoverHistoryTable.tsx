import Link from "next/link";
import { formatHandoverTimestamp } from "@/lib/shift-handover/format";
import { formatShiftTypeLabel } from "@/lib/shift-handover/mapper";
import { formatCurrency } from "@/lib/utils";
import { ShiftStatusBadge } from "@/features/shift-handover/components/ShiftStatusBadge";
import type { ShiftHandover } from "@/types/shift-handover";

type ShiftHandoverHistoryTableProps = {
  handovers: ShiftHandover[];
};

export function ShiftHandoverHistoryTable({ handovers }: ShiftHandoverHistoryTableProps) {
  if (handovers.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
        No shift handover history yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-semibold">Shift Number</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Opened By</th>
              <th className="px-4 py-3 font-semibold">Closed By</th>
              <th className="px-4 py-3 font-semibold">Opening Cash</th>
              <th className="px-4 py-3 font-semibold">Closing Cash</th>
              <th className="px-4 py-3 font-semibold">Variance</th>
              <th className="px-4 py-3 font-semibold">Acknowledged</th>
              <th className="px-4 py-3 font-semibold">Tasks Done</th>
              <th className="px-4 py-3 font-semibold">Issues Resolved</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {handovers.map((shift) => (
              <tr key={shift.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-medium">
                  <Link
                    href={`/dashboard/shift-handover/${shift.handoverNumber}`}
                    className="text-primary hover:underline"
                  >
                    {shift.handoverNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatShiftTypeLabel(shift.shiftType)}</td>
                <td className="px-4 py-3">
                  <ShiftStatusBadge status={shift.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {shift.openedByName ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {shift.closedByName ?? "—"}
                </td>
                <td className="px-4 py-3">{formatCurrency(shift.cashDrawerAmount)}</td>
                <td className="px-4 py-3">
                  {shift.closingCash != null ? formatCurrency(shift.closingCash) : "—"}
                </td>
                <td className="px-4 py-3">
                  {shift.cashVariance != null ? (
                    <span
                      className={
                        shift.cashVariance !== 0
                          ? "font-medium text-amber-700 dark:text-amber-400"
                          : ""
                      }
                    >
                      {formatCurrency(shift.cashVariance)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {shift.acknowledgedAt ? (
                    <span>
                      {shift.acknowledgedByName ?? "—"}
                      <br />
                      <span className="text-xs">
                        {formatHandoverTimestamp(shift.acknowledgedAt)}
                      </span>
                    </span>
                  ) : (
                    "Pending"
                  )}
                </td>
                <td className="px-4 py-3">{shift.tasksCompletedCount}</td>
                <td className="px-4 py-3">{shift.issuesResolvedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
