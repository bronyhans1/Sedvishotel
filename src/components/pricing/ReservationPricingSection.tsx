"use client";

import { useEffect, useMemo, useState } from "react";

import { LiveRateCalculator } from "@/components/pricing/LiveRateCalculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildReservationPricingSnapshot,
  rulesForBooking,
} from "@/lib/reservations/rate-management";
import type { WalkInPricingSnapshot } from "@/lib/walk-in/pricing";
import { formatRatePercentLabel } from "@/lib/reservations/pricing";
import {
  BOOKING_PRICING_MODES,
  OVERRIDE_REASON_LABELS,
  PRICING_MODE_LABELS,
  type OverrideReason,
  type PricingMode,
  type ReservationPricingInput,
  type RoomTypePricingRule,
} from "@/types/pricing";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const OVERRIDE_REASONS = Object.entries(OVERRIDE_REASON_LABELS) as Array<
  [OverrideReason, string]
>;

export type ReservationPricingSectionProps = {
  rackRate: number;
  checkIn: string;
  checkOut: string;
  pricingRules?: RoomTypePricingRule[];
  taxRate?: number;
  serviceChargeRate?: number;
  requireApproval?: boolean;
  value: ReservationPricingInput;
  onChange: (next: ReservationPricingInput) => void;
  showLiveSummary?: boolean;
  /** When provided, reuses wizard pricing snapshot instead of recomputing. */
  pricingSnapshot?: WalkInPricingSnapshot | null;
  walkInVat?: boolean;
};

export function ReservationPricingSection({
  rackRate,
  checkIn,
  checkOut,
  pricingRules = [],
  taxRate = 0.15,
  serviceChargeRate = 0,
  requireApproval = false,
  value,
  onChange,
  showLiveSummary = true,
  pricingSnapshot,
  walkInVat = false,
}: ReservationPricingSectionProps) {
  const pricingMode = value.pricingMode ?? "standard";
  const [localChargedRate, setLocalChargedRate] = useState(
    value.chargedRate ?? rackRate
  );

  const bookingRules = useMemo(
    () => (checkIn ? rulesForBooking(pricingRules, checkIn) : pricingRules),
    [pricingRules, checkIn]
  );

  useEffect(() => {
    if (pricingMode !== "manual_override") return;
    setLocalChargedRate(value.chargedRate ?? rackRate);
  }, [pricingMode, value.chargedRate, rackRate]);

  const preview = useMemo(() => {
    if (pricingSnapshot) return pricingSnapshot;
    if (!checkIn || !checkOut || checkOut <= checkIn || rackRate <= 0) {
      return null;
    }
    return buildReservationPricingSnapshot({
      rackRate,
      checkIn,
      checkOut,
      pricingInput: {
        ...value,
        pricingMode,
        chargedRate:
          pricingMode === "manual_override" ? localChargedRate : value.chargedRate,
      },
      pricingRules: bookingRules,
      taxRate,
      serviceChargeRate,
      walkInVat,
    });
  }, [
    pricingSnapshot,
    rackRate,
    checkIn,
    checkOut,
    value,
    pricingMode,
    localChargedRate,
    bookingRules,
    taxRate,
    serviceChargeRate,
    walkInVat,
  ]);

  const availableModes = useMemo(() => {
    const configuredModes = new Set(bookingRules.map((r) => r.pricingMode));
    return BOOKING_PRICING_MODES.filter(
      (mode) =>
        mode === "standard" ||
        mode === "manual_override" ||
        mode === "complimentary" ||
        configuredModes.has(mode)
    );
  }, [bookingRules]);

  function updatePricing(patch: Partial<ReservationPricingInput>) {
    onChange({ ...value, ...patch });
  }

  const vatLabel =
    serviceChargeRate > 0
      ? `VAT (${formatRatePercentLabel(taxRate)}%)`
      : `VAT (${formatRatePercentLabel(taxRate)}%)`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Rack Rate (read-only)</Label>
          <Input value={rackRate} readOnly className="bg-muted/40" />
        </div>
        <div className="space-y-2">
          <Label>Pricing Mode</Label>
          <select
            className={selectClass}
            value={pricingMode}
            onChange={(e) =>
              updatePricing({ pricingMode: e.target.value as PricingMode })
            }
          >
            {availableModes.map((mode) => (
              <option key={mode} value={mode}>
                {PRICING_MODE_LABELS[mode]}
              </option>
            ))}
          </select>
        </div>
        {pricingMode === "manual_override" ? (
          <div className="space-y-2 md:col-span-2">
            <Label>Charged Rate</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={localChargedRate}
              onChange={(e) => {
                const next = Number(e.target.value) || 0;
                setLocalChargedRate(next);
                updatePricing({ chargedRate: next });
              }}
            />
          </div>
        ) : preview ? (
          <div className="space-y-2">
            <Label>Charged Rate</Label>
            <Input
              value={preview.chargedRate}
              readOnly
              className="bg-muted/40"
            />
          </div>
        ) : null}
        {(pricingMode !== "standard" || preview?.discountAmount) && (
          <>
            <div className="space-y-2">
              <Label>Override Reason</Label>
              <select
                className={selectClass}
                value={value.overrideReason ?? ""}
                onChange={(e) =>
                  updatePricing({
                    overrideReason: (e.target.value || undefined) as
                      | OverrideReason
                      | undefined,
                  })
                }
              >
                <option value="">Auto from pricing mode</option>
                {OVERRIDE_REASONS.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {value.overrideReason === "other" ? (
              <div className="space-y-2">
                <Label>Explanation</Label>
                <Input
                  value={value.overrideReasonDetail ?? ""}
                  onChange={(e) =>
                    updatePricing({ overrideReasonDetail: e.target.value })
                  }
                  placeholder="Describe the override"
                />
              </div>
            ) : null}
            {requireApproval && (preview?.discountAmount ?? 0) > 0 ? (
              <div className="space-y-2 md:col-span-2">
                <Label>Approved By (staff user id)</Label>
                <Input
                  value={value.approvedById ?? ""}
                  onChange={(e) =>
                    updatePricing({ approvedById: e.target.value || undefined })
                  }
                  placeholder="Manager user UUID when approval required"
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      {showLiveSummary && preview ? (
        <LiveRateCalculator
          preview={preview}
          requireApproval={requireApproval}
          vatLabel={vatLabel}
        />
      ) : null}
    </div>
  );
}
