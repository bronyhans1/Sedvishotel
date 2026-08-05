import { cn } from "@/lib/utils";
import {
  OVERSTAY_FINANCIAL_STATUS_LABELS,
  type OverstayFinancialStatus,
} from "@/types/overstay";

const styles: Record<OverstayFinancialStatus, string> = {
  none: "bg-muted text-muted-foreground ring-border",
  pending_charge:
    "bg-amber-50 text-amber-900 ring-amber-600/30 dark:bg-amber-500/15 dark:text-amber-200",
  approved:
    "bg-sky-50 text-sky-900 ring-sky-600/30 dark:bg-sky-500/15 dark:text-sky-200",
  waived:
    "bg-violet-50 text-violet-900 ring-violet-600/30 dark:bg-violet-500/15 dark:text-violet-200",
  posted:
    "bg-emerald-50 text-emerald-900 ring-emerald-600/30 dark:bg-emerald-500/15 dark:text-emerald-200",
  rejected:
    "bg-rose-50 text-rose-900 ring-rose-600/30 dark:bg-rose-500/15 dark:text-rose-200",
  skipped: "bg-muted text-muted-foreground ring-border",
};

type Props = {
  status: OverstayFinancialStatus;
  className?: string;
};

/** Reception-facing overstay financial status — no accounting internals. */
export function OverstayFinancialBadge({ status, className }: Props) {
  if (status === "none") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        styles[status],
        className
      )}
    >
      {OVERSTAY_FINANCIAL_STATUS_LABELS[status]}
    </span>
  );
}
