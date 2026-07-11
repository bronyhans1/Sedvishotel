"use client";

import { formatReceiptDateTime } from "@/lib/receipt/receipt-core";
import type { ReceiptPrintHistoryEntry } from "@/lib/payments/receipt-print-history";

export function ReceiptPrintHistoryList({
  entries,
}: {
  entries: ReceiptPrintHistoryEntry[];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No receipt prints recorded yet.</p>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {entries.map((entry, index) => (
        <div
          key={`${entry.label}-${entry.printedAt}-${index}`}
          className="rounded-md border bg-muted/20 px-3 py-2"
        >
          <p className="font-medium">{entry.label}</p>
          <p>
            <span className="text-muted-foreground">Printed by: </span>
            {entry.printedBy}
          </p>
          <p>
            <span className="text-muted-foreground">Printed at: </span>
            {formatReceiptDateTime(entry.printedAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
