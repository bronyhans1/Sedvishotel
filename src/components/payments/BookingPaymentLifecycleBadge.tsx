import { cn } from "@/lib/utils";
import {
  BOOKING_PAYMENT_LIFECYCLE_LABELS,
  type BookingPaymentLifecycleStatus,
} from "@/types/booking-payment";

const styles: Record<BookingPaymentLifecycleStatus, string> = {
  not_started:
    "bg-slate-100 text-slate-600 ring-slate-500/25 dark:bg-slate-500/15 dark:text-slate-400",
  awaiting_payment:
    "bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/15 dark:text-amber-400",
  partially_paid:
    "bg-blue-50 text-blue-700 ring-blue-600/25 dark:bg-blue-500/15 dark:text-blue-400",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-500/15 dark:text-emerald-400",
  pay_at_check_out:
    "bg-violet-50 text-violet-700 ring-violet-600/25 dark:bg-violet-500/15 dark:text-violet-400",
  company_billing:
    "bg-indigo-50 text-indigo-700 ring-indigo-600/25 dark:bg-indigo-500/15 dark:text-indigo-400",
  complimentary:
    "bg-teal-50 text-teal-700 ring-teal-600/25 dark:bg-teal-500/15 dark:text-teal-400",
};

export function BookingPaymentLifecycleBadge({
  status,
  className,
}: {
  status: BookingPaymentLifecycleStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        styles[status],
        className
      )}
    >
      {BOOKING_PAYMENT_LIFECYCLE_LABELS[status]}
    </span>
  );
}
