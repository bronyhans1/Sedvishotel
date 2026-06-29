import { PAYMENT_METHOD_LABELS } from "@/lib/analytics/payment-labels";
import { humanizeLabel } from "@/lib/labels/humanize";
import type { PaymentMethod } from "@/types/payment";

export function PaymentMethodLabel({ method }: { method: PaymentMethod }) {
  return <>{PAYMENT_METHOD_LABELS[method] ?? humanizeLabel(method)}</>;
}
