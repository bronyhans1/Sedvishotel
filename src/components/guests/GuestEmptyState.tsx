import { Search, Users } from "lucide-react";

import { SHMSEmptyState } from "@/components/shared/SHMSEmptyState";

type GuestEmptyStateProps = {
  variant: "no-results" | "no-guests";
  onClearFilters?: () => void;
  className?: string;
};

export function GuestEmptyState({
  variant,
  onClearFilters,
  className,
}: GuestEmptyStateProps) {
  const isSearch = variant === "no-results";

  return (
    <SHMSEmptyState
      className={className}
      icon={isSearch ? Search : Users}
      title={isSearch ? "No guests match your search" : "No guests yet"}
      description={
        isSearch
          ? "Try adjusting your search term or status filter to find the guest you need."
          : "Guest profiles will appear here as reservations and walk-ins are registered at SEDVIS HOTEL."
      }
      actionLabel={isSearch && onClearFilters ? "Clear filters" : undefined}
      onAction={onClearFilters}
    />
  );
}
