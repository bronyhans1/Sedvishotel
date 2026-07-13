"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { SuccessAnimation } from "@/components/loading/SuccessAnimation";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  details?: string[];
  durationMs?: number;
};

type CelebrationState = {
  headline: string;
  toastMessage: string;
};

type ToastContextValue = {
  /** Immediate success toast (no animation). */
  success: (message: string) => void;
  /** Structured success toast with optional detail lines and custom duration. */
  successDetail: (
    headline: string,
    details?: string[],
    durationMs?: number
  ) => void;
  error: (message: string) => void;
  /**
   * Premium flow: success animation → toast.
   * @param headline Short label shown in animation (e.g. "Staff Created")
   * @param toastMessage Optional longer toast text; defaults to headline
   */
  celebrate: (headline: string, toastMessage?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const CELEBRATION_DURATION_MS = 1000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (
      message: string,
      variant: ToastVariant,
      options?: { details?: string[]; durationMs?: number }
    ) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now());

      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          variant,
          details: options?.details,
          durationMs: options?.durationMs,
        },
      ]);
      window.setTimeout(
        () => dismiss(id),
        options?.durationMs ?? 4500
      );
    },
    [dismiss]
  );

  const handleCelebrationComplete = useCallback(() => {
    if (!celebration) return;
    push(celebration.toastMessage, "success");
    setCelebration(null);
  }, [celebration, push]);

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message: string) => push(message, "success"),
      successDetail: (
        headline: string,
        details?: string[],
        durationMs?: number
      ) => push(headline, "success", { details, durationMs }),
      error: (message: string) => push(message, "error"),
      celebrate: (headline: string, toastMessage?: string) => {
        setCelebration({
          headline,
          toastMessage: toastMessage ?? headline,
        });
      },
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {celebration ? (
        <SuccessAnimation
          headline={celebration.headline}
          onComplete={handleCelebrationComplete}
          durationMs={CELEBRATION_DURATION_MS}
        />
      ) : null}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg",
              toast.variant === "success"
                ? "border-brand-gold/35 bg-white text-brand-navy dark:bg-brand-navy dark:text-white"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {toast.variant === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p className="flex-1 leading-snug">
              <span className="font-medium">{toast.message}</span>
              {toast.details?.length ? (
                <span className="mt-1 block space-y-0.5 text-xs text-muted-foreground">
                  {toast.details.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              ) : null}
            </p>
            <button
              type="button"
              className="shrink-0 rounded-sm opacity-70 hover:opacity-100"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
