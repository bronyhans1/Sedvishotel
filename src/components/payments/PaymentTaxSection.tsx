"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import {
  VAT_EXEMPTION_REASON_OPTIONS,
  type VatExemptionReason,
} from "@/types/payment";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type PaymentTaxState = {
  vatApplied: boolean;
  vatExemptionReason?: VatExemptionReason | "";
  vatExemptionNotes?: string;
};

type Props = {
  vatRate: number;
  vatApplied: boolean;
  vatAmount: number;
  canOverrideVat: boolean;
  values: PaymentTaxState;
  onChange: (patch: Partial<PaymentTaxState>) => void;
};

export function PaymentTaxSection({
  vatRate,
  vatApplied,
  vatAmount,
  canOverrideVat,
  values,
  onChange,
}: Props) {
  const vatEnabledGlobally = vatRate > 0;

  if (!vatEnabledGlobally) {
    return null;
  }

  function handleApplyVatChange(checked: boolean) {
    if (!canOverrideVat) return;
    onChange({
      vatApplied: checked,
      vatExemptionReason: checked ? "" : values.vatExemptionReason,
      vatExemptionNotes: checked ? "" : values.vatExemptionNotes,
    });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium">Tax</p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={vatApplied}
          disabled={!canOverrideVat}
          onChange={(e) => handleApplyVatChange(e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary disabled:opacity-60"
        />
        Apply VAT
        {!canOverrideVat ? (
          <span className="text-xs text-muted-foreground">
            (requires override permission)
          </span>
        ) : null}
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">VAT Rate</Label>
          <p className="text-sm font-medium">
            {vatApplied ? `${(vatRate * 100).toFixed(1)}%` : "0%"}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">VAT Amount</Label>
          <p className="text-sm font-semibold">
            {vatApplied ? formatCurrency(vatAmount) : formatCurrency(0)}
          </p>
        </div>
      </div>

      {!vatApplied ? (
        <div className="space-y-3 border-t pt-3">
          <div className="space-y-2">
            <Label>Exemption Reason</Label>
            <select
              required
              value={values.vatExemptionReason ?? ""}
              onChange={(e) =>
                onChange({
                  vatExemptionReason: e.target.value as VatExemptionReason | "",
                })
              }
              className={selectClass}
            >
              <option value="">Select reason</option>
              {VAT_EXEMPTION_REASON_OPTIONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>
          {values.vatExemptionReason === "Other" ? (
            <div className="space-y-2">
              <Label>Exemption Notes</Label>
              <Textarea
                required
                value={values.vatExemptionNotes ?? ""}
                onChange={(e) => onChange({ vatExemptionNotes: e.target.value })}
                rows={2}
                placeholder="Describe the exemption"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
