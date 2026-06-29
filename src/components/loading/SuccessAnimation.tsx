"use client";

import { useEffect } from "react";

type Props = {
  headline: string;
  onComplete: () => void;
  durationMs?: number;
};

export function SuccessAnimation({
  headline,
  onComplete,
  durationMs = 1000,
}: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-brand-navy/45 backdrop-blur-[3px]"
      role="status"
      aria-live="polite"
      aria-label={headline}
    >
      <div className="relative flex flex-col items-center gap-4 rounded-2xl border border-brand-gold/30 bg-white px-10 py-9 shadow-2xl animate-shms-success-in dark:bg-brand-navy">
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl animate-shms-glow opacity-60"
          aria-hidden
        />
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg
            viewBox="0 0 52 52"
            className="h-16 w-16 text-brand-gold"
            aria-hidden
          >
            <circle
              className="animate-shms-check-circle"
              cx="26"
              cy="26"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              className="animate-shms-check-mark"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 27l7 7 16-16"
            />
          </svg>
        </div>
        <p className="relative text-center text-base font-semibold tracking-wide text-brand-navy dark:text-white">
          {headline}
        </p>
      </div>
    </div>
  );
}
