import { CalendarX, Search } from "lucide-react";

import { SHMSEmptyState } from "@/components/shared/SHMSEmptyState";

type Props = {
  variant: "no-reservations" | "no-results";
  onClear?: () => void;
  className?: string;
};

export function ReservationEmptyState({ variant, onClear, className }: Props) {
  const isSearch = variant === "no-results";

  return (
    <SHMSEmptyState
      className={className}
      icon={isSearch ? Search : CalendarX}
      title={isSearch ? "No matching reservations" : "No reservations yet"}
      description={
        isSearch
          ? "Adjust your search or filters to find the booking you need."
          : "Create a reservation to begin managing guest stays and room occupancy at SEDVIS HOTEL."
      }
      actionLabel={isSearch && onClear ? "Clear filters" : undefined}
      onAction={onClear}
    />
  );
}
