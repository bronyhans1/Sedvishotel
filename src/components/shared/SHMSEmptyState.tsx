import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

/** Premium branded empty state for SHMS list modules. */
export function SHMSEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-brand-gold/20 bg-gradient-to-b from-white to-brand-navy/[0.03] px-6 py-16 text-center shadow-sm dark:from-brand-navy/40 dark:to-brand-navy/20",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at top, oklch(0.72 0.12 75 / 0.12), transparent 60%)",
        }}
      />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-gold/10">
        <Icon className="h-8 w-8 text-brand-gold" aria-hidden />
      </div>
      <h3 className="relative mt-5 text-lg font-semibold tracking-wide text-brand-navy dark:text-white">
        {title}
      </h3>
      <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button
          className="relative mt-6 border-brand-gold/30"
          variant="outline"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
