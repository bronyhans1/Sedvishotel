import { cn } from "@/lib/utils";
import type { DepartureClassification } from "@/lib/reservations/departure-classification";

const styles: Record<
  DepartureClassification,
  { className: string; emoji: string } | null
> = {
  expected_departure: {
    className:
      "bg-emerald-50 text-emerald-800 ring-emerald-600/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    emoji: "🟢",
  },
  late_checkout: {
    className:
      "bg-amber-50 text-amber-900 ring-amber-600/30 dark:bg-amber-500/15 dark:text-amber-300",
    emoji: "🟡",
  },
  overstay: {
    className:
      "bg-red-50 text-red-800 ring-red-600/30 dark:bg-red-500/15 dark:text-red-300",
    emoji: "🔴",
  },
  in_house: {
    className:
      "bg-sky-50 text-sky-800 ring-sky-600/25 dark:bg-sky-500/15 dark:text-sky-300",
    emoji: "",
  },
  checked_out: null,
  checked_out_early: null,
  cancelled: null,
  no_show: null,
  pending: null,
  confirmed: null,
};

const defaultLabels: Partial<Record<DepartureClassification, string>> = {
  expected_departure: "Expected Departure",
  late_checkout: "Late Check-Out",
  overstay: "Overstay",
  in_house: "In House",
};

type Props = {
  classification: DepartureClassification;
  label?: string;
  className?: string;
  showEmoji?: boolean;
};

/** Operational departure badge — not a reservation status badge. */
export function DepartureClassificationBadge({
  classification,
  label,
  className,
  showEmoji = true,
}: Props) {
  const style = styles[classification];
  if (!style) return null;

  const text = label ?? defaultLabels[classification] ?? classification;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        style.className,
        className
      )}
    >
      {showEmoji && style.emoji ? <span aria-hidden>{style.emoji}</span> : null}
      {text}
    </span>
  );
}
