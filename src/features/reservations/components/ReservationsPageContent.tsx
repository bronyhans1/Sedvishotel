"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AvailabilityChecker } from "@/components/reservations/AvailabilityChecker";
import { CreateReservationModal } from "@/components/reservations/CreateReservationModal";
import { EditReservationModal } from "@/components/reservations/EditReservationModal";
import {
  ReservationFilters,
  type ReservationFilterState,
} from "@/components/reservations/ReservationFilters";
import { ReservationEmptyState } from "@/components/reservations/ReservationEmptyState";
import { ReservationTable } from "@/components/reservations/ReservationTable";
import { PageContainer } from "@/components/shared/PageContainer";
import { ReservationsStats } from "@/features/reservations/components/ReservationsStats";
import { filterReservations } from "@/features/reservations/lib/filter-reservations";
import type {
  ReservationRoomOption,
  ReservationRoomTypeOption,
} from "@/features/reservations/load-reservations-page";
import type { ReservationAccess } from "@/lib/auth/reservation-access.types";
import { siteConfig } from "@/config/site";
import type { Reservation, ReservationStats } from "@/types/reservation";

const defaultFilters: ReservationFilterState = {
  search: "",
  status: "all",
  bookingSource: "all",
  roomTypeId: "all",
  dateFrom: "",
  dateTo: "",
};

type ReservationsPageContentProps = {
  reservations: Reservation[];
  stats: ReservationStats;
  access: ReservationAccess;
  roomOptions: ReservationRoomOption[];
  roomTypeOptions: ReservationRoomTypeOption[];
};

export function ReservationsPageContent({
  reservations,
  stats,
  access,
  roomOptions,
  roomTypeOptions,
}: ReservationsPageContentProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [filters, setFilters] = useState(defaultFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRes, setEditRes] = useState<Reservation | null>(null);

  const filtered = useMemo(
    () => filterReservations(reservations, filters),
    [reservations, filters]
  );

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.status !== "all" ||
    filters.bookingSource !== "all" ||
    filters.roomTypeId !== "all" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  const emptyVariant =
    reservations.length === 0
      ? "no-reservations"
      : hasActiveFilters
        ? "no-results"
        : "no-reservations";

  return (
    <PageContainer
      title="Reservations"
      description={`Manage guest bookings and occupancy at ${siteConfig.name}.`}
      actions={
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {reservations.length} shown
        </p>
      }
    >
      <ReservationsStats stats={stats} />

      <AvailabilityChecker />

      <ReservationFilters
        filters={filters}
        onFiltersChange={setFilters}
        onCreate={access.canCreate ? () => setCreateOpen(true) : undefined}
        showCreateButton={access.canCreate}
        roomTypeOptions={roomTypeOptions}
      />

      {filtered.length === 0 ? (
        <ReservationEmptyState
          variant={emptyVariant}
          onClear={
            hasActiveFilters ? () => setFilters(defaultFilters) : undefined
          }
        />
      ) : (
        <ReservationTable
          reservations={filtered}
          canEdit={access.canEdit}
          onEdit={access.canEdit ? setEditRes : undefined}
        />
      )}

      {access.canCreate && (
        <CreateReservationModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          roomOptions={roomOptions}
          onSuccess={refresh}
        />
      )}
      {access.canEdit && (
        <EditReservationModal
          reservation={editRes}
          open={!!editRes}
          onOpenChange={(open) => !open && setEditRes(null)}
          roomOptions={roomOptions}
          onSuccess={refresh}
        />
      )}
    </PageContainer>
  );
}
