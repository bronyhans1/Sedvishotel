"use client";

import { LayoutGrid, List, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  FloorFilterValue,
  RoomViewMode,
  StatusFilterValue,
} from "@/types/room";
import type { FloorOption } from "@/types/floor";
import { STATUS_OPTIONS } from "@/types/room";

type RoomFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  floor: FloorFilterValue;
  onFloorChange: (value: FloorFilterValue) => void;
  floorOptions: FloorOption[];
  status: StatusFilterValue;
  onStatusChange: (value: StatusFilterValue) => void;
  viewMode: RoomViewMode;
  onViewModeChange: (mode: RoomViewMode) => void;
  onAddRoom?: () => void;
  showAddButton?: boolean;
  className?: string;
};

const floorFilterOptions = (floorOptions: FloorOption[]) => [
  { value: "all" as const, label: "All Floors" },
  ...[...floorOptions]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((f) => ({ value: f.id as FloorFilterValue, label: f.name })),
];

const statusFilterOptions: { value: StatusFilterValue; label: string }[] = [
  { value: "all", label: "All Statuses" },
  ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
];

const selectClassName =
  "h-9 w-full min-w-[140px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-auto";

export function RoomFilters({
  search,
  onSearchChange,
  floor,
  onFloorChange,
  floorOptions,
  status,
  onStatusChange,
  viewMode,
  onViewModeChange,
  onAddRoom,
  showAddButton = true,
  className,
}: RoomFiltersProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {showAddButton && onAddRoom ? (
          <Button onClick={onAddRoom} className="w-full shrink-0 sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Room
          </Button>
        ) : null}

        <div className="relative flex-1 lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search room number (e.g. 001, 015)"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            aria-label="Filter by floor"
            value={floor}
            onChange={(e) =>
              onFloorChange(e.target.value as FloorFilterValue)
            }
            className={selectClassName}
          >
            {floorFilterOptions(floorOptions).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) =>
              onStatusChange(e.target.value as StatusFilterValue)
            }
            className={selectClassName}
          >
            {statusFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="flex rounded-md border p-0.5">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => onViewModeChange("table")}
              aria-pressed={viewMode === "table"}
            >
              <List className="h-4 w-4" />
              <span className="ml-1.5 hidden xs:inline">Table</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => onViewModeChange("grid")}
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="ml-1.5 hidden xs:inline">Grid</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
