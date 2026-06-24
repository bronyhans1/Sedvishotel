import { BarChart3 } from "lucide-react";

import { SHMSEmptyState } from "@/components/shared/SHMSEmptyState";

type Props = {
  className?: string;
};

export function ReportsEmptyState({ className }: Props) {
  return (
    <SHMSEmptyState
      className={className}
      icon={BarChart3}
      title="Reports building"
      description="Analytics cards populate as reservations, payments, and housekeeping data accumulate. Export summaries when metrics are available."
    />
  );
}
