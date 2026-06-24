import { BedDouble, Search } from "lucide-react";

import { SHMSEmptyState } from "@/components/shared/SHMSEmptyState";

type RoomEmptyStateProps = {
  variant: "no-results" | "no-rooms";
  onClearFilters?: () => void;
  className?: string;
};

export function RoomEmptyState({
  variant,
  onClearFilters,
  className,
}: RoomEmptyStateProps) {
  const isSearch = variant === "no-results";

  return (
    <SHMSEmptyState
      className={className}
      icon={isSearch ? Search : BedDouble}
      title={isSearch ? "No rooms match your search" : "No rooms found"}
      description={
        isSearch
          ? "Try adjusting your search term or filters to locate the room."
          : "Register rooms in the inventory to manage availability and housekeeping."
      }
      actionLabel={isSearch && onClearFilters ? "Clear filters" : undefined}
      onAction={onClearFilters}
    />
  );
}
