import { ArrowDown } from "lucide-react";

import { cn } from "@/lib/utils";

const steps = [
  { label: "Reservation Confirmed", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  { label: "Check-In", color: "bg-primary/15 text-primary" },
  { label: "Occupied Room", color: "bg-red-500/15 text-red-700 dark:text-red-400" },
  { label: "Active Stay", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  { label: "Check-Out", color: "bg-amber-500/15 text-amber-800 dark:text-amber-400" },
  { label: "Pending Cleaning", color: "bg-amber-500/10 text-amber-700" },
  { label: "Cleaning", color: "bg-blue-500/10 text-blue-700" },
  { label: "Ready", color: "bg-emerald-500/10 text-emerald-700" },
  { label: "Available", color: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300" },
];

export function HotelWorkflowDiagram() {
  return (
    <div className="rounded-xl border bg-card p-4 md:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
        Hotel Operations Workflow
      </h3>
      <div className="flex flex-col items-center gap-1 max-w-xs mx-auto md:max-w-none md:flex-row md:flex-wrap md:justify-center md:gap-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex flex-col items-center md:flex-row">
            <span
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold text-center whitespace-nowrap",
                step.color
              )}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <ArrowDown className="h-4 w-4 my-0.5 text-muted-foreground md:hidden" />
            )}
            {i < steps.length - 1 && (
              <span className="hidden md:inline text-muted-foreground mx-1">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
