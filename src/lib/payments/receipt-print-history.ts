export type ReceiptPrintHistoryEntry = {
  label: string;
  printedAt: string;
  printedBy: string;
  transactionId?: string;
  printCount?: number;
};

export function buildReceiptPrintHistory(
  logs: Array<{
    action_code: string;
    user_name: string | null;
    created_at: string;
    metadata: Record<string, unknown>;
  }>
): ReceiptPrintHistoryEntry[] {
  return logs.map((log, index) => {
    const transactionId =
      typeof log.metadata.transaction_id === "string"
        ? log.metadata.transaction_id
        : undefined;
    const printCount =
      typeof log.metadata.print_count === "number"
        ? log.metadata.print_count
        : undefined;

    const label = index === 0 ? "Original Print" : `Reprint #${index}`;

    return {
      label,
      printedAt: log.created_at,
      printedBy: log.user_name?.trim() || "System",
      transactionId,
      printCount,
    };
  });
}

export function buildReceiptPrintHistoryForTransaction(
  logs: Array<{
    action_code: string;
    user_name: string | null;
    created_at: string;
    metadata: Record<string, unknown>;
  }>,
  transactionId: string
): ReceiptPrintHistoryEntry[] {
  const filtered = logs.filter(
    (log) => log.metadata.transaction_id === transactionId
  );
  return buildReceiptPrintHistory(filtered);
}
