import type { PosReportDimensions } from "@/types/pos";

/** Future reporting service entry points — UI not implemented in Stage 4. */
export const POS_REPORT_DIMENSIONS: PosReportDimensions[] = [
  "product",
  "category",
  "cashier",
  "payment_method",
  "room_charge",
  "walk_in",
  "vat",
  "revenue",
];

export type PosReportFilter = {
  fromDate?: string;
  toDate?: string;
  dimension?: PosReportDimensions;
};

export const POS_REPORT_SERVICE_HOOK = "PosRepository.listSalesForBusinessDate";
