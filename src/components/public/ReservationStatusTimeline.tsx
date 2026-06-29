import { Check, Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  buildReservationLookupTimeline,
  RESERVATION_LOOKUP_STAGES,
} from "@/lib/public/reservation-status-timeline";
import { cn } from "@/lib/utils";
import type { DbReservationStatus } from "@/types/database/enums";

type Props = {
  statusCode: DbReservationStatus;
};

function StageIndicator({ state }: { state: "completed" | "current" | "upcoming" }) {
  if (state === "completed") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-navy text-white">
        <Check className="h-4 w-4" aria-hidden />
      </span>
    );
  }

  if (state === "current") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-brand-gold bg-brand-gold/15">
        <Circle className="h-3 w-3 fill-brand-gold text-brand-gold" aria-hidden />
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 bg-muted/40">
      <Circle className="h-3 w-3 text-muted-foreground/50" aria-hidden />
    </span>
  );
}

export function ReservationStatusTimeline({ statusCode }: Props) {
  const timeline = buildReservationLookupTimeline(statusCode);

  if (timeline.kind === "cancelled") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center">
        <Badge variant="destructive" className="text-sm">
          Reservation Cancelled
        </Badge>
      </div>
    );
  }

  if (timeline.kind === "no_show") {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-center">
        <Badge variant="outline" className="border-amber-500/40 text-amber-800 dark:text-amber-200">
          Reservation No Show
        </Badge>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-brand-gold">
        Reservation Status
      </p>
      <ol className="mt-4 space-y-0">
        {RESERVATION_LOOKUP_STAGES.map((label, index) => {
          const state = timeline.stages[index];
          const isLast = index === RESERVATION_LOOKUP_STAGES.length - 1;

          return (
            <li key={label} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast ? (
                <span
                  className={cn(
                    "absolute left-[13px] top-7 h-[calc(100%-4px)] w-px",
                    state === "completed" ? "bg-brand-navy/40" : "bg-border"
                  )}
                  aria-hidden
                />
              ) : null}
              <StageIndicator state={state} />
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cn(
                    "text-sm font-medium",
                    state === "upcoming" && "text-muted-foreground",
                    state === "current" && "text-brand-navy"
                  )}
                >
                  {label}
                  {state === "current" ? (
                    <span className="ml-2 text-xs font-normal text-brand-gold">(Current)</span>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
