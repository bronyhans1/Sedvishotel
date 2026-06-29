import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getPaymentAccess } from "@/lib/auth/payment-access";
import { getPosAccess } from "@/lib/auth/pos-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getProductCategoryService } from "@/lib/product-categories/get-product-category-service";
import { getProductService } from "@/lib/products/get-product-service";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import {
  getDefaultTaxRate,
  isGlobalVatEnabled,
} from "@/lib/settings/get-tax-rate";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProductCategoryOption } from "@/types/product";
import type { ActiveStay } from "@/types/stay";

export async function loadPosPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getPosAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const productService = await getProductService();
  const categoryService = await getProductCategoryService();
  const reservationService = await getReservationService();
  const paymentAccess = getPaymentAccess(session);
  const defaultTaxRate = await getDefaultTaxRate();

  const [products, categories, activeStays] = await Promise.all([
    productService.list(ctx, session),
    categoryService.list(ctx, session),
    reservationService
      .listActiveStays(ctx, session)
      .catch((): ActiveStay[] => []),
  ]);

  const categoryOptions: ProductCategoryOption[] = categories
    .filter((category) => category.isActive)
    .map((category) => ({ id: category.id, name: category.name }));

  return {
    products,
    categoryOptions,
    activeStays,
    access,
    defaultTaxRate,
    defaultVatApplied: isGlobalVatEnabled(defaultTaxRate),
    canOverrideVat: paymentAccess.canOverrideVat,
  };
}
