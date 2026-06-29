import { roundCurrency } from "@/lib/payments/currency";
import { computeVatOnBase } from "@/lib/payments/payment-settlement";
import type { PosCartLine, PosCartSettlement } from "@/types/pos";

export function buildPosCartSettlement(
  lines: PosCartLine[],
  discount: number,
  vatRate: number,
  vatApplied: boolean
): PosCartSettlement {
  const lineSettlements = lines.map((line) => {
    const lineSubtotal = roundCurrency(line.unitPrice * line.quantity);
    const lineVat =
      vatApplied && line.vatApplicable
        ? computeVatOnBase(lineSubtotal, vatRate)
        : 0;
    return {
      productId: line.productId,
      lineSubtotal,
      vatAmount: lineVat,
      total: roundCurrency(lineSubtotal + lineVat),
    };
  });

  const rawSubtotal = roundCurrency(
    lineSettlements.reduce((sum, line) => sum + line.lineSubtotal, 0)
  );
  const appliedDiscount = roundCurrency(Math.min(discount, rawSubtotal));
  const subtotal = roundCurrency(rawSubtotal - appliedDiscount);

  let vatAmount = 0;
  if (vatApplied && rawSubtotal > 0) {
    const discountRatio = appliedDiscount / rawSubtotal;
    vatAmount = roundCurrency(
      lineSettlements.reduce((sum, line, index) => {
        const original = lines[index];
        if (!original.vatApplicable) return sum;
        const adjustedBase = roundCurrency(
          line.lineSubtotal * (1 - discountRatio)
        );
        return sum + computeVatOnBase(adjustedBase, vatRate);
      }, 0)
    );
  }

  return {
    subtotal,
    vatAmount,
    discount: appliedDiscount,
    total: roundCurrency(subtotal + vatAmount),
    vatRate,
    vatApplied,
    lines: lineSettlements,
  };
}

export function isProductSellable(product: {
  availableForSale: boolean;
  isActive: boolean;
  status: string;
  currentStock: number;
}): boolean {
  return (
    product.availableForSale &&
    product.isActive &&
    product.status === "active" &&
    product.currentStock > 0
  );
}

export function isProductOutOfStock(product: { currentStock: number }): boolean {
  return product.currentStock <= 0;
}
