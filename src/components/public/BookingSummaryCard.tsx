"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";

import { calculateBookingPricing } from "@/lib/public-booking";
import { formatCurrency } from "@/lib/utils";
import type { BookingSearch, PublicBookingPricingSettings, PublicRoom } from "@/types/public";

type Props = {
  room: PublicRoom;
  search: BookingSearch;
  pricingSettings: PublicBookingPricingSettings;
  className?: string;
};

function formatRoomTypeLabel(categoryId: string): string {
  if (categoryId === "standard-room") return "Standard Room";
  if (categoryId === "deluxe-room") return "Deluxe Room";
  return categoryId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={`text-right font-medium ${valueClassName ?? ""}`}>{value}</dd>
    </div>
  );
}

/** Live booking summary — pricing from shared SHMS `computeStayPricing` via hotel settings. */
export function BookingSummaryCard({ room, search, pricingSettings, className }: Props) {
  const pricing = useMemo(
    () => calculateBookingPricing(room, search.checkIn, search.checkOut, pricingSettings),
    [room, search.checkIn, search.checkOut, pricingSettings]
  );

  return (
    <aside
      className={`rounded-2xl border border-brand-gold/20 bg-card p-5 shadow-sm ${className ?? ""}`}
      aria-label="Booking summary"
    >
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-brand-gold">
        Booking Summary
      </p>

      <dl className="mt-4 space-y-2.5">
        <SummaryRow label="Room" value={room.name} />
        <SummaryRow label="Room Type" value={formatRoomTypeLabel(room.categoryId)} />
        <SummaryRow label="Check-In Date" value={search.checkIn} />
        <SummaryRow label="Check-Out Date" value={search.checkOut} />
        <SummaryRow
          label="Number of Nights"
          value={pricing.nights}
        />
        <SummaryRow label="Adults" value={search.adults} />
        <SummaryRow label="Children" value={search.children} />
      </dl>

      <div className="my-4 border-t border-dashed" />

      <dl className="space-y-2.5">
        <SummaryRow
          label="Room Rate (per night)"
          value={formatCurrency(room.pricePerNight)}
        />
        <SummaryRow label="Subtotal" value={formatCurrency(pricing.subtotal)} />
        <SummaryRow
          label={`Taxes (${pricing.taxLabel}%)`}
          value={formatCurrency(pricing.taxes)}
        />
        <SummaryRow
          label={`Service Charge (${pricing.serviceLabel}%)`}
          value={formatCurrency(pricing.service)}
        />
      </dl>

      <div className="mt-4 rounded-xl bg-brand-navy/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-brand-navy">Total Amount</span>
          <span className="font-serif text-xl font-bold text-brand-navy">
            {formatCurrency(pricing.total)}
          </span>
        </div>
      </div>
    </aside>
  );
}
