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
  guestName?: string;
  extrasSummary?: string[];
  compact?: boolean;
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
export function BookingSummaryCard({
  room,
  search,
  pricingSettings,
  className,
  guestName,
  extrasSummary,
  compact = false,
}: Props) {
  const pricing = useMemo(
    () => calculateBookingPricing(room, search.checkIn, search.checkOut, pricingSettings),
    [room, search.checkIn, search.checkOut, pricingSettings]
  );

  const guests = search.adults + search.children;

  return (
    <aside
      className={`rounded-2xl border border-brand-gold/20 bg-card p-5 shadow-sm ${className ?? ""}`}
      aria-label="Booking summary"
    >
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-brand-gold">
        {compact ? "Selected Room" : "Booking Summary"}
      </p>

      <div className="mt-3">
        <p className="font-serif text-lg font-semibold leading-snug">{room.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatCurrency(room.pricePerNight)} / Night
        </p>
      </div>

      <dl className="mt-4 space-y-2.5">
        {!compact ? (
          <SummaryRow label="Room Type" value={formatRoomTypeLabel(room.categoryId)} />
        ) : null}
        <SummaryRow label="Stay Dates" value={`${search.checkIn} → ${search.checkOut}`} />
        <SummaryRow label="Guests" value={`${guests} guest${guests === 1 ? "" : "s"}`} />
        <SummaryRow label="Nights" value={pricing.nights} />
        {guestName?.trim() ? <SummaryRow label="Guest" value={guestName.trim()} /> : null}
        {extrasSummary && extrasSummary.length > 0 ? (
          <SummaryRow label="Extras" value={extrasSummary.join(", ")} />
        ) : null}
      </dl>

      {!compact ? (
        <>
          <div className="my-4 border-t border-dashed" />
          <dl className="space-y-2.5">
            <SummaryRow
              label="Price Per Night"
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
        </>
      ) : (
        <div className="my-4 border-t border-dashed" />
      )}

      <div className="mt-4 rounded-xl bg-brand-navy/5 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-brand-navy">
            {compact ? "Estimated Total" : "Total Amount"}
          </span>
          <span className="font-serif text-xl font-bold text-brand-navy">
            {formatCurrency(pricing.total)}
          </span>
        </div>
      </div>
    </aside>
  );
}
