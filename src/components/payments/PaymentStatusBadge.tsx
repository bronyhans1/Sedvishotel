import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/types/payment";

const styles: Record<PaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-500/15 dark:text-emerald-400",
  partial: "bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/15 dark:text-amber-400",
  pending: "bg-slate-100 text-slate-600 ring-slate-500/25 dark:bg-slate-500/15 dark:text-slate-400",
  partially_refunded: "bg-orange-50 text-orange-800 ring-orange-600/25 dark:bg-orange-500/15 dark:text-orange-400",
  refunded: "bg-red-50 text-red-700 ring-red-600/25 dark:bg-red-500/15 dark:text-red-400",
};

const labels: Record<PaymentStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  pending: "Pending",
  partially_refunded: "Partially Refunded",
  refunded: "Refunded",
};

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        styles[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
