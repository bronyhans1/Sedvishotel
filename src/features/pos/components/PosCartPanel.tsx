"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { PaymentTaxSection, type PaymentTaxState } from "@/components/payments/PaymentTaxSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { PosCartLine, PosCartSettlement } from "@/types/pos";

type PosCartPanelProps = {
  lines: PosCartLine[];
  settlement: PosCartSettlement;
  discount: number;
  onDiscountChange: (value: number) => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  canOverrideVat: boolean;
  taxState: PaymentTaxState;
  onTaxChange: (patch: Partial<PaymentTaxState>) => void;
};

export function PosCartPanel({
  lines,
  settlement,
  discount,
  onDiscountChange,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  canOverrideVat,
  taxState,
  onTaxChange,
}: PosCartPanelProps) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold">Cart</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={!lines.length}>
          Clear
        </Button>
      </div>

      <div className="space-y-3 p-4">
        {!lines.length ? (
          <p className="text-sm text-muted-foreground">Scan or select products to begin.</p>
        ) : (
          lines.map((line) => (
            <div key={line.productId} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(line.unitPrice)} · {line.unit}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemove(line.productId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDecrease(line.productId)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-medium">{line.quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onIncrease(line.productId)}
                    disabled={line.quantity >= line.currentStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-semibold">
                  {formatCurrency(line.unitPrice * line.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 border-t p-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="pos-discount">
            Discount
          </label>
          <Input
            id="pos-discount"
            type="number"
            min={0}
            step="0.01"
            value={discount || ""}
            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
          />
        </div>

        <PaymentTaxSection
          vatRate={settlement.vatRate}
          vatApplied={settlement.vatApplied}
          vatAmount={settlement.vatAmount}
          canOverrideVat={canOverrideVat}
          values={taxState}
          onChange={onTaxChange}
        />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(settlement.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT</span>
            <span>{formatCurrency(settlement.vatAmount)}</span>
          </div>
          {settlement.discount > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatCurrency(settlement.discount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(settlement.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
