"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useBranding } from "@/components/branding/BrandingProvider";
import type { PaymentTaxState } from "@/components/payments/PaymentTaxSection";
import { SubmitButton } from "@/components/loading/SubmitButton";
import { Button } from "@/components/ui/button";
import { PosCartPanel } from "@/features/pos/components/PosCartPanel";
import { PosGuestPicker } from "@/features/pos/components/PosGuestPicker";
import { PosProductGrid } from "@/features/pos/components/PosProductGrid";
import { PosSidebar } from "@/features/pos/components/PosSidebar";
import {
  completePosSaleAction,
  logPosReceiptPrintedAction,
} from "@/features/pos/actions";
import { useToast } from "@/hooks/use-toast";
import { createPosIdempotencyKey } from "@/lib/pos/atomic-commit";
import { triggerCashDrawerAfterSale } from "@/lib/pos/cash-drawer";
import {
  filterPosCatalog,
  findProductByBarcode,
  productToCartLine,
} from "@/lib/pos/filter-catalog";
import { printPosReceipt } from "@/lib/pos/print-pos-receipt";
import { buildPosCartSettlement, isProductSellable } from "@/lib/pos/settlement";
import type { PosAccess } from "@/lib/auth/pos-access.types";
import type {
  PosCartLine,
  PosPaymentMethod,
  PosSale,
  SaleCustomerType,
} from "@/types/pos";
import type { Product, ProductCategoryOption } from "@/types/product";
import type { ActiveStay } from "@/types/stay";

type PosPageContentProps = {
  products: Product[];
  categoryOptions: ProductCategoryOption[];
  activeStays: ActiveStay[];
  access: PosAccess;
  defaultTaxRate: number;
  defaultVatApplied: boolean;
  canOverrideVat: boolean;
};

export function PosPageContent({
  products,
  categoryOptions,
  activeStays,
  access,
  defaultTaxRate,
  defaultVatApplied,
  canOverrideVat,
}: PosPageContentProps) {
  const router = useRouter();
  const toast = useToast();
  const branding = useBranding();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cart, setCart] = useState<PosCartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerType, setCustomerType] = useState<SaleCustomerType>("walk_in");
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("cash");
  const [selectedStay, setSelectedStay] = useState<ActiveStay | null>(null);
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);
  const [taxState, setTaxState] = useState<PaymentTaxState>({
    vatApplied: defaultVatApplied,
    vatExemptionReason: "",
    vatExemptionNotes: "",
  });
  const [error, setError] = useState("");
  const [isPending, startSubmit] = useTransition();
  const idempotencyKeyRef = useRef("");

  const catalog = useMemo(
    () => filterPosCatalog(products, search, categoryId),
    [products, search, categoryId]
  );

  const settlement = useMemo(
    () =>
      buildPosCartSettlement(
        cart,
        discount,
        defaultTaxRate,
        taxState.vatApplied
      ),
    [cart, discount, defaultTaxRate, taxState.vatApplied]
  );

  function addProductToCart(product: Product) {
    if (!isProductSellable(product)) {
      toast.error(`${product.name} is out of stock or unavailable.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (!existing) {
        return [...current, productToCartLine(product, 1)];
      }
      if (existing.quantity >= product.currentStock) {
        toast.error(`Only ${product.currentStock} units available.`);
        return current;
      }
      return current.map((line) =>
        line.productId === product.id
          ? { ...line, quantity: line.quantity + 1 }
          : line
      );
    });
    setError("");
  }

  function handleBarcodeSubmit(value: string) {
    if (!value) return;
    const product = findProductByBarcode(products, value);
    if (!product) {
      toast.error("No product found for that barcode or SKU.");
      return;
    }
    addProductToCart(product);
    setSearch("");
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) => {
          if (line.productId !== productId) return line;
          const nextQty = line.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > line.currentStock) {
            toast.error(`Only ${line.currentStock} units available.`);
            return line;
          }
          return { ...line, quantity: nextQty };
        })
        .filter((line): line is PosCartLine => Boolean(line))
    );
  }

  function clearCart() {
    setCart([]);
    setDiscount(0);
    setError("");
    idempotencyKeyRef.current = createPosIdempotencyKey();
  }

  function resetPosAfterSale() {
    clearCart();
    setSelectedStay(null);
    setCustomerType("walk_in");
    setPaymentMethod("cash");
    startTransition(() => router.refresh());
  }

  async function handleCompletedSale(sale: PosSale) {
    printPosReceipt(sale, {
      hotelName: branding?.hotelName,
      logoUrl: branding?.logoUrl,
      primaryColor: branding?.primaryColor,
    });
    await logPosReceiptPrintedAction(sale.id);

    if (sale.payments[0]?.paymentMethod === "cash") {
      await triggerCashDrawerAfterSale({
        saleId: sale.id,
        receiptNumber: sale.payments[0]?.receiptNumber,
        amount: sale.total,
        timestamp: new Date().toISOString(),
      });
    }

    resetPosAfterSale();
  }

  function handleCompleteSale() {
    setError("");
    if (!cart.length) {
      setError("Add at least one product to the cart.");
      return;
    }

    if (customerType === "room_charge" && !selectedStay) {
      setError("Select a checked-in guest for room charge.");
      return;
    }

    startSubmit(async () => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = createPosIdempotencyKey();
      }

      const result = await completePosSaleAction(
        {
          customerType,
          reservationId:
            customerType === "room_charge" ? selectedStay?.reservationId : null,
          guestId:
            customerType === "room_charge" ? selectedStay?.guestId : null,
          lines: cart,
          discount,
          vatApplied: taxState.vatApplied,
          vatRate: defaultTaxRate,
          paymentMethod:
            customerType === "room_charge" ? "room_charge" : paymentMethod,
          idempotencyKey: idempotencyKeyRef.current,
        },
        canOverrideVat
          ? {
              vatApplied: taxState.vatApplied,
            }
          : undefined
      );

      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      idempotencyKeyRef.current = createPosIdempotencyKey();

      if (result.idempotentReplay) {
        toast.success(
          "This sale was already completed. No additional receipt was printed."
        );
        resetPosAfterSale();
        return;
      }

      toast.celebrate(
        customerType === "room_charge" ? "Room Charge Recorded" : "Sale Complete",
        `${result.sale.saleNumber} recorded successfully.`
      );

      if (customerType === "walk_in") {
        await handleCompletedSale(result.sale);
      } else {
        resetPosAfterSale();
      }
    });
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Retail POS</h1>
          <p className="text-sm text-muted-foreground">
            Scan products, build a cart, and complete walk-in or room charges.
          </p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <PosSidebar
          search={search}
          categoryId={categoryId}
          categories={categoryOptions}
          onSearchChange={setSearch}
          onCategoryChange={setCategoryId}
          onBarcodeSubmit={handleBarcodeSubmit}
        />

        <div className="min-h-0 overflow-y-auto rounded-xl border bg-muted/10 p-4">
          <PosProductGrid products={catalog} onAdd={addProductToCart} />
        </div>

        <PosCartPanel
          lines={cart}
          settlement={settlement}
          discount={discount}
          onDiscountChange={setDiscount}
          onIncrease={(productId) => updateQuantity(productId, 1)}
          onDecrease={(productId) => updateQuantity(productId, -1)}
          onRemove={(productId) =>
            setCart((current) =>
              current.filter((line) => line.productId !== productId)
            )
          }
          onClear={clearCart}
          canOverrideVat={canOverrideVat}
          taxState={taxState}
          onTaxChange={(patch) => setTaxState((current) => ({ ...current, ...patch }))}
        />
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        {error ? (
          <p className="mb-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="customer-type">
                Customer Type
              </label>
              <select
                id="customer-type"
                value={customerType}
                onChange={(e) => {
                  const next = e.target.value as SaleCustomerType;
                  setCustomerType(next);
                  if (next === "room_charge") {
                    setPaymentMethod("room_charge");
                    setGuestPickerOpen(true);
                  } else {
                    setSelectedStay(null);
                    setPaymentMethod("cash");
                  }
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="walk_in">Walk-In Customer</option>
                <option value="room_charge">Charge To Room</option>
              </select>
            </div>

            {customerType === "walk_in" ? (
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="payment-method">
                  Payment Method
                </label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PosPaymentMethod)
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
            ) : (
              <div className="sm:col-span-2">
                <p className="mb-1 text-sm font-medium">Guest</p>
                {selectedStay ? (
                  <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span>
                      {selectedStay.guestName} · Room {selectedStay.roomNumber}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGuestPickerOpen(true)}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setGuestPickerOpen(true)}
                  >
                    Select Checked-In Guest
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={clearCart} disabled={isPending}>
              Clear Cart
            </Button>
            {access.canCreate ? (
              <SubmitButton
                type="button"
                loading={isPending}
                loadingLabel="Processing…"
                onClick={handleCompleteSale}
              >
                Complete Sale
              </SubmitButton>
            ) : null}
          </div>
        </div>
      </div>

      <PosGuestPicker
        open={guestPickerOpen}
        onOpenChange={setGuestPickerOpen}
        stays={activeStays}
        onSelect={setSelectedStay}
      />
    </div>
  );
}
