/**
 * Analytics core-data loading helpers.
 * Column-scoped / consumer-scoped reads for Phase 1 CPU reduction.
 * Does NOT change Business Date semantics or KPI formulas.
 */

import type { Invoice, InvoiceStatus } from "@/types/invoice";
import type { Guest } from "@/types/guest";
import type { DbInvoiceStatus } from "@/types/database";

export type AnalyticsCoreDataNeeds = {
  payments: boolean;
  /** Full payment timeline (VAT / method breakdown). */
  paymentTimelines: boolean;
  invoices: boolean;
  reservations: boolean;
  rooms: boolean;
  guests: boolean;
};

/** Dashboard home: operational KPIs — no guest/invoice catalogue. */
export const DASHBOARD_CORE_NEEDS: AnalyticsCoreDataNeeds = {
  payments: true,
  paymentTimelines: false,
  invoices: false,
  reservations: true,
  rooms: true,
  guests: false,
};

/** Revenue page: lifetime financial KPIs — no guest catalogue. */
export const REVENUE_CORE_NEEDS: AnalyticsCoreDataNeeds = {
  payments: true,
  paymentTimelines: true,
  invoices: true,
  reservations: true,
  rooms: true,
  guests: false,
};

/** Reports (+ CSV export): full analytics surface including guests. */
export const REPORTS_CORE_NEEDS: AnalyticsCoreDataNeeds = {
  payments: true,
  paymentTimelines: true,
  invoices: true,
  reservations: true,
  rooms: true,
  guests: true,
};

/** Resolve invoice display status — mirrors invoices/mapper rules. */
export function resolveAnalyticsInvoiceStatus(
  balance: number,
  amountPaid: number,
  status: DbInvoiceStatus
): InvoiceStatus {
  if (status === "void" || status === "draft") return "draft";
  if (balance <= 0) return "paid";
  if (amountPaid > 0) return "partial";
  return "outstanding";
}

/**
 * Minimal Invoice objects for analytics computes that only read `.status`
 * (paid / unpaid invoice counts).
 */
export function invoiceStatusStub(status: InvoiceStatus): Invoice {
  return {
    id: "",
    invoiceNumber: "",
    guestId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestAddress: "",
    reservationId: "",
    reservationNumber: "",
    roomNumber: "",
    roomTypeName: "",
    floorLabel: "",
    invoiceDate: "",
    checkInDate: "",
    checkOutDate: "",
    numberOfNights: 0,
    roomRate: 0,
    roomCharges: 0,
    taxes: 0,
    additionalCharges: 0,
    discounts: 0,
    totalAmount: 0,
    amountPaid: 0,
    balance: 0,
    status,
  };
}

/** Minimal Guest objects for reports guest KPIs (visits / VIP / count). */
export function guestAnalyticsStub(input: {
  id: string;
  totalVisits: number;
  vipStatus: boolean;
}): Guest {
  return {
    id: input.id,
    fullName: "",
    phone: "",
    email: "",
    nationality: "",
    idType: "other",
    idNumber: "",
    address: "",
    guestStatus: "reserved",
    totalVisits: input.totalVisits,
    totalSpent: 0,
    vipStatus: input.vipStatus,
    notes: [],
  };
}
