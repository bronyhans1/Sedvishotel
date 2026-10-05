"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
import { Pagination } from "@/components/shared/Pagination";
import { ReservationsStats } from "@/features/reservations/components/ReservationsStats";
import { buildReservationListQuery } from "@/features/reservations/lib/parse-reservation-search-params";
import { buildPageHref } from "@/lib/pagination/pagination";
import type {
  ReservationRoomTypeOption,
} from "@/features/reservations/load-reservations-page";
import type { ReservationAccess } from "@/lib/auth/reservation-access.types";
import { siteConfig } from "@/config/site";
import type { CheckoutPolicy } from "@/types/late-checkout";
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
  total: number;
  page: number;
  pageSize: number;
  filters: ReservationFilterState;
  stats: ReservationStats;
  access: ReservationAccess;
  roomTypeOptions: ReservationRoomTypeOption[];
  businessDate: string;
  checkoutPolicy: CheckoutPolicy;
  defaultTaxRate: number;
  defaultVatApplied: boolean;
  serviceChargeRate: number;
  requireRateOverrideApproval: boolean;
  canOverrideVat: boolean;
};

export function ReservationsPageContent({
  reservations,
  total,
  page,
  pageSize,
  filters,
  stats,
  access,
  roomTypeOptions,
  businessDate,
  checkoutPolicy,
  defaultTaxRate,
  defaultVatApplied,
  serviceChargeRate,
  requireRateOverrideApproval,
  canOverrideVat,
}: ReservationsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [draftSearch, setDraftSearch] = useState(filters.search);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRes, setEditRes] = useState<Reservation | null>(null);

  useEffect(() => {
    setDraftSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (draftSearch.trim() === filters.search.trim()) return;
    const handle = window.setTimeout(() => {
      const query = buildReservationListQuery({ ...filters, search: draftSearch }, 1);
      startTransition(() => {
        router.push(query ? `/dashboard/reservations?${query}` : "/dashboard/reservations");
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [draftSearch, filters, router]);

  function pushFilters(next: ReservationFilterState, nextPage = 1) {
    const query = buildReservationListQuery(next, nextPage);
    startTransition(() => {
      router.push(query ? `/dashboard/reservations?${query}` : "/dashboard/reservations");
    });
  }

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  function goToPage(nextPage: number) {
    startTransition(() => {
      router.push(
        buildPageHref("/dashboard/reservations", searchParams.toString(), nextPage)
      );
    });
  }

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.status !== "all" ||
    filters.bookingSource !== "all" ||
    filters.roomTypeId !== "all" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  const emptyVariant =
    stats.total === 0
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
          {total} of {stats.total} shown
        </p>
      }
    >
      <ReservationsStats stats={stats} />

      <AvailabilityChecker />

      <ReservationFilters
        filters={{ ...filters, search: draftSearch }}
        onFiltersChange={(next) => {
          if (next.search !== draftSearch) {
            setDraftSearch(next.search);
            return;
          }
          pushFilters(next, 1);
        }}
        onCreate={access.canCreate ? () => setCreateOpen(true) : undefined}
        showCreateButton={access.canCreate}
        roomTypeOptions={roomTypeOptions}
      />

      {total === 0 ? (
        <ReservationEmptyState
          variant={emptyVariant}
          onClear={
            hasActiveFilters
              ? () => {
                  setDraftSearch("");
                  pushFilters(defaultFilters, 1);
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <ReservationTable
            reservations={reservations}
            canEdit={access.canEdit}
            onEdit={access.canEdit ? setEditRes : undefined}
            businessDate={businessDate}
            policyCheckOutTime={checkoutPolicy.checkOutTime}
          />
          {total > pageSize ? (
            <Pagination
              page={page}
              total={total}
              pageSize={pageSize}
              itemLabel="reservations"
              onPageChange={goToPage}
            />
          ) : null}
        </div>
      )}

      {access.canCreate && (
        <CreateReservationModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          roomTypeOptions={roomTypeOptions}
          defaultTaxRate={defaultTaxRate}
          defaultVatApplied={defaultVatApplied}
          serviceChargeRate={serviceChargeRate}
          requireRateOverrideApproval={requireRateOverrideApproval}
          canOverrideVat={canOverrideVat}
          onSuccess={refresh}
        />
      )}
      {access.canEdit && (
        <EditReservationModal
          reservation={editRes}
          open={!!editRes}
          onOpenChange={(open) => !open && setEditRes(null)}
          roomTypeOptions={roomTypeOptions}
          onSuccess={refresh}
        />
      )}
    </PageContainer>
  );
}
