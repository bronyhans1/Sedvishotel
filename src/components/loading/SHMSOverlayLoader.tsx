import { LoaderLogo } from "@/components/loading/LoaderLogo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type Props = {
  /** Full viewport overlay or inline within content area */
  variant?: "overlay" | "inline";
  message?: string;
  className?: string;
};

export function SHMSOverlayLoader({
  variant = "overlay",
  message = "Loading...",
  className,
}: Props) {
  const isOverlay = variant === "overlay";

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        isOverlay
          ? "fixed inset-0 z-[200] bg-brand-navy/50 backdrop-blur-[2px]"
          : "min-h-[50vh] w-full p-8",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="relative flex flex-col items-center gap-5 rounded-2xl border border-brand-gold/25 bg-white px-10 py-10 shadow-2xl dark:bg-brand-navy dark:shadow-black/40">
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl animate-shms-glow opacity-80"
          aria-hidden
        />
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-brand-gold/15 blur-xl animate-shms-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-gold/30 bg-brand-navy/5 dark:bg-white/5">
            <div className="absolute inset-0 animate-shms-spin rounded-full border-2 border-transparent border-t-brand-gold" />
            <LoaderLogo size="lg" />
          </div>
        </div>
        <div className="relative text-center">
          <p className="text-lg font-bold tracking-wide text-brand-navy dark:text-white">
            {siteConfig.name}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">
            {siteConfig.shortName}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
