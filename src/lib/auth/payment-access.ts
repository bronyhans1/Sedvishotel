import { sessionHasPermission } from "@/lib/auth/permissions";
import type { PaymentAccess } from "@/lib/auth/payment-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getPaymentAccess(session: AuthSession): PaymentAccess {
  const canView = sessionHasPermission(session, "payments", "view");
  const canRecord = sessionHasPermission(session, "payments", "create");
  const canUpdate = sessionHasPermission(session, "payments", "edit");
  const canRefund =
    sessionHasPermission(session, "payments", "manage") ||
    sessionHasPermission(session, "payments", "delete");
  const canOverrideVat =
    session.permissions.includes("payments.override_vat") ||
    sessionHasPermission(session, "payments", "override_vat");

  return { canView, canRecord, canUpdate, canRefund, canOverrideVat };
}

export function requirePaymentView(session: AuthSession): void {
  if (!sessionHasPermission(session, "payments", "view")) {
    throw new Error("Forbidden: payments.view required");
  }
}
