"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type BookingJourneyStepId =
  | "stay"
  | "room"
  | "guest"
  | "extras"
  | "review";

export const BOOKING_JOURNEY_STEPS: Array<{
  id: BookingJourneyStepId;
  label: string;
  shortLabel: string;
}> = [
  { id: "stay", label: "Stay Details", shortLabel: "Stay" },
  { id: "room", label: "Choose Room", shortLabel: "Room" },
  { id: "guest", label: "Guest Details", shortLabel: "Guest" },
  { id: "extras", label: "Extras", shortLabel: "Extras" },
  { id: "review", label: "Review & Confirm", shortLabel: "Review" },
];

const STEP_ORDER: BookingJourneyStepId[] = BOOKING_JOURNEY_STEPS.map((s) => s.id);

type Props = {
  current: BookingJourneyStepId;
};

export function BookingJourneyProgress({ current }: Props) {
  const currentIndex = STEP_ORDER.indexOf(current);

  return (
    <nav
      className="rounded-[1.75rem] border bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-500 sm:p-6"
      aria-label="Your booking journey"
    >
      <div className="mb-5">
        <p className="text-sm font-medium tracking-tight text-foreground sm:text-base">
          Your Booking Journey
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your reservation in five simple steps.
        </p>
      </div>

      <ol className="grid grid-cols-5 gap-1 sm:gap-2">
        {BOOKING_JOURNEY_STEPS.map((step, index) => {
          const completed = index < currentIndex;
          const active = index === currentIndex;

          return (
            <li key={step.id} className="min-w-0">
              <div
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl px-1 py-2 transition-all duration-500 sm:px-2 sm:py-3",
                  active && "bg-brand-navy text-white shadow-md scale-[1.02]",
                  completed && !active && "bg-brand-gold/10",
                  !active && !completed && "bg-muted/60 text-muted-foreground"
                )}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 sm:h-9 sm:w-9 sm:text-sm",
                    active && "bg-brand-gold text-brand-navy shadow-sm",
                    completed && !active && "bg-brand-gold text-brand-navy",
                    !active &&
                      !completed &&
                      "bg-background text-muted-foreground ring-1 ring-border"
                  )}
                  aria-hidden={!active}
                >
                  {completed && !active ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "hidden text-center text-[11px] font-medium leading-tight sm:block sm:text-xs",
                    active && "text-white",
                    completed && !active && "text-brand-navy",
                    !active && !completed && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "block text-center text-[10px] font-medium leading-tight sm:hidden",
                    active && "text-white",
                    completed && !active && "text-brand-navy",
                    !active && !completed && "text-muted-foreground"
                  )}
                >
                  {step.shortLabel}
                </span>
                <span className="sr-only">
                  {step.label}
                  {active ? ", current step" : completed ? ", completed" : ""}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
