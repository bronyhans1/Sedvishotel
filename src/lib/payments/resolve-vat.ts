import { getPaymentAccess } from "@/lib/auth/payment-access";
import { computeTransactionVatFields } from "@/lib/payments/vat";
import {
  computeInvoiceTotal,
  getReservationChargeBase,
} from "@/lib/payments/payment-settlement";
import { roundCurrency } from "@/lib/payments/currency";
import type { CreatePaymentTransactionInput } from "@/repositories/payment.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import type { PaymentFormValues } from "@/types/payment";
import type { DbReservationWithRelations } from "@/types/database";

export function resolveEffectiveTotalDue(
  reservation: DbReservationWithRelations,
  vatApplied: boolean,
  vatRate: number
): number {
  const chargeBase = roundCurrency(
    Number(reservation.subtotal) + Number(reservation.late_checkout_fee ?? 0)
  );
  return computeInvoiceTotal(chargeBase, vatApplied, vatRate);
}

export type StayVatOverrideValues = {
  vatApplied?: boolean;
  vatExemptionReason?: string | null;
  vatExemptionNotes?: string | null;
};

/**
 * Resolves VAT Applied / Exempt for stay pricing (reservations), reusing the same
 * permission and exemption-reason rules as payment / walk-in / POS.
 */
export function resolveStayVatApplied(
  session: AuthSession,
  values: StayVatOverrideValues,
  defaultVatRate: number
): { vatApplied: boolean; vatOverridden: boolean } {
  const access = getPaymentAccess(session);
  const globalVatEnabled = defaultVatRate > 0;
  let vatApplied = globalVatEnabled;

  if (!access.canOverrideVat) {
    vatApplied = globalVatEnabled;
  } else {
    vatApplied = (values.vatApplied ?? globalVatEnabled) && globalVatEnabled;
  }

  if (!vatApplied && globalVatEnabled) {
    const reason = values.vatExemptionReason?.trim();
    if (!reason) {
      throw new ServiceError(
        "A VAT exemption reason is required when VAT is not applied.",
        "VALIDATION",
        400
      );
    }
    if (reason === "Other" && !values.vatExemptionNotes?.trim()) {
      throw new ServiceError(
        "Notes are required when the exemption reason is Other.",
        "VALIDATION",
        400
      );
    }
  }

  return {
    vatApplied,
    vatOverridden: globalVatEnabled && !vatApplied,
  };
}

/** Zero taxes on a stay pricing result while keeping service charge (reservation parity). */
export function applyStayVatExemption<
  T extends {
    subtotal: number;
    taxes: number;
    serviceCharge: number;
    totalAmount: number;
  },
>(financials: T, vatApplied: boolean): T {
  if (vatApplied) return financials;
  return {
    ...financials,
    taxes: 0,
    totalAmount: roundCurrency(financials.subtotal + financials.serviceCharge),
  };
}

export function resolvePaymentTransactionVat(
  session: AuthSession,
  ctx: ServiceContext,
  values: PaymentFormValues,
  defaultVatRate: number,
  chargeBase: number,
  now: string
): Pick<
  CreatePaymentTransactionInput,
  | "vat_applied"
  | "vat_rate"
  | "vat_amount"
  | "vat_exemption_reason"
  | "vat_exemption_notes"
  | "vat_overridden_by"
  | "vat_overridden_at"
> & { vatOverridden: boolean } {
  const { vatApplied, vatOverridden } = resolveStayVatApplied(
    session,
    values,
    defaultVatRate
  );

  const vatRate = vatApplied ? defaultVatRate : 0;
  const { vatAmount } = computeTransactionVatFields(
    values.amount,
    vatApplied,
    vatRate,
    chargeBase
  );

  return {
    vat_applied: vatApplied,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    vat_exemption_reason: vatApplied ? null : values.vatExemptionReason ?? null,
    vat_exemption_notes: vatApplied
      ? null
      : values.vatExemptionNotes?.trim() || null,
    vat_overridden_by: vatOverridden ? ctx.userId : null,
    vat_overridden_at: vatOverridden ? now : null,
    vatOverridden,
  };
}

export type PaymentTransactionVatResolution = ReturnType<
  typeof resolvePaymentTransactionVat
>;

/** Strips the internal `vatOverridden` flag before persisting a transaction row. */
export function toPaymentTransactionVatFields(
  resolution: PaymentTransactionVatResolution
): Pick<
  CreatePaymentTransactionInput,
  | "vat_applied"
  | "vat_rate"
  | "vat_amount"
  | "vat_exemption_reason"
  | "vat_exemption_notes"
  | "vat_overridden_by"
  | "vat_overridden_at"
> {
  return {
    vat_applied: resolution.vat_applied,
    vat_rate: resolution.vat_rate,
    vat_amount: resolution.vat_amount,
    vat_exemption_reason: resolution.vat_exemption_reason,
    vat_exemption_notes: resolution.vat_exemption_notes,
    vat_overridden_by: resolution.vat_overridden_by,
    vat_overridden_at: resolution.vat_overridden_at,
  };
}

export { getReservationChargeBase };
