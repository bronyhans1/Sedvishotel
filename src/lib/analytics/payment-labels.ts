import type { PaymentMethod } from "@/types/payment";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  card: "Card",
  bank_transfer: "Bank Transfer",
  online: "Other",
  mixed: "Split Payment",
};
