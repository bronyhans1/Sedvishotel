"use client";

import Link from "next/link";
import { Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GroupFilterState } from "@/features/group-reservations/lib/filter-groups";
import type { CorporateAccount } from "@/types/corporate-account";
import {
  GROUP_TYPE_LABELS,
  type GroupReservationStatus,
  type GroupReservationType,
} from "@/types/group-reservation";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const STATUS_OPTIONS: Array<GroupReservationStatus | "all"> = [
  "all",
  "draft",
  "confirmed",
  "partially_checked_in",
  "in_house",
  "partially_checked_out",
  "completed",
  "closed",
  "cancelled",
];

const TYPE_OPTIONS: Array<GroupReservationType | "all"> = [
  "all",
  ...(Object.keys(GROUP_TYPE_LABELS) as GroupReservationType[]),
];

type Props = {
  filters: GroupFilterState;
  onFiltersChange: (filters: GroupFilterState) => void;
  corporateAccounts: CorporateAccount[];
  canCreate?: boolean;
  onClear?: () => void;
};

export function GroupReservationFilters({
  filters,
  onFiltersChange,
  corporateAccounts,
  canCreate,
  onClear,
}: Props) {
  function update<K extends keyof GroupFilterState>(key: K, value: GroupFilterState[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  const companies = [...new Set(corporateAccounts.map((c) => c.companyName))].sort();

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search group name, number, company…"
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            className="pl-9"
          />
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/group-reservations/new">
              <Plus className="h-4 w-4" />
              Create Group
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(e) =>
            update("status", e.target.value as GroupFilterState["status"])
          }
          className={selectClass}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by group type"
          value={filters.groupType}
          onChange={(e) =>
            update("groupType", e.target.value as GroupFilterState["groupType"])
          }
          className={selectClass}
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All Types" : GROUP_TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by company"
          value={filters.company || "all"}
          onChange={(e) => update("company", e.target.value === "all" ? "" : e.target.value)}
          className={selectClass}
        >
          <option value="all">All Companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <Input
          type="date"
          value={filters.arrivalFrom}
          onChange={(e) => update("arrivalFrom", e.target.value)}
          aria-label="Arrival from"
        />
        <Input
          type="date"
          value={filters.arrivalTo}
          onChange={(e) => update("arrivalTo", e.target.value)}
          aria-label="Arrival to"
        />
        <Input
          type="date"
          value={filters.departureFrom}
          onChange={(e) => update("departureFrom", e.target.value)}
          aria-label="Departure from"
        />
      </div>

      {onClear && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
