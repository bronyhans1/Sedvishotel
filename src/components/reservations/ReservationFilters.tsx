"use client";

import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BOOKING_SOURCE_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  type BookingSource,
  type ReservationStatus,
} from "@/types/reservation";

export type ReservationFilterState = {
  search: string;
  status: ReservationStatus | "all";
  bookingSource: BookingSource | "all";
  roomTypeId: string | "all";
  dateFrom: string;
  dateTo: string;
};

type RoomTypeOption = { id: string; name: string };

type Props = {
  filters: ReservationFilterState;
  onFiltersChange: (f: ReservationFilterState) => void;
  onCreate?: () => void;
  showCreateButton?: boolean;
  roomTypeOptions: RoomTypeOption[];
  className?: string;
};

const selectClass =
  "h-9 w-full min-w-[130px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-auto";

export function ReservationFilters({
  filters,
  onFiltersChange,
  onCreate,
  showCreateButton = true,
  roomTypeOptions,
  className,
}: Props) {
  const set = (patch: Partial<ReservationFilterState>) =>
    onFiltersChange({ ...filters, ...patch });

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {showCreateButton && onCreate ? (
          <Button onClick={onCreate} className="w-full shrink-0 sm:w-auto">
            <Plus className="h-4 w-4" />
            Create Reservation
          </Button>
        ) : null}
        <div className="relative flex-1 xl:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Reservation #, guest, or room..."
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(e) =>
            set({ status: e.target.value as ReservationStatus | "all" })
          }
          className={selectClass}
        >
          <option value="all">All Statuses</option>
          {RESERVATION_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by booking source"
          value={filters.bookingSource}
          onChange={(e) =>
            set({ bookingSource: e.target.value as BookingSource | "all" })
          }
          className={selectClass}
        >
          <option value="all">All Sources</option>
          {BOOKING_SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by room type"
          value={filters.roomTypeId}
          onChange={(e) => set({ roomTypeId: e.target.value })}
          className={selectClass}
        >
          <option value="all">All Room Types</option>
          {roomTypeOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <Input
          type="date"
          aria-label="Date from"
          value={filters.dateFrom}
          onChange={(e) => set({ dateFrom: e.target.value })}
          className="h-9 w-full md:w-auto"
        />
        <Input
          type="date"
          aria-label="Date to"
          value={filters.dateTo}
          onChange={(e) => set({ dateTo: e.target.value })}
          className="h-9 w-full md:w-auto"
        />
      </div>
    </div>
  );
}
