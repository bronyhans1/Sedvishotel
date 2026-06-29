import { sessionHasPermission } from "@/lib/auth/permissions";
import type { InvoiceAccess } from "@/lib/auth/invoice-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getInvoiceAccess(session: AuthSession): InvoiceAccess {
  const canView = sessionHasPermission(session, "invoices", "view");
  const canCreate = sessionHasPermission(session, "invoices", "create");
  const canUpdate = sessionHasPermission(session, "invoices", "edit");
  const canMarkPaid =
    sessionHasPermission(session, "invoices", "edit") ||
    sessionHasPermission(session, "invoices", "manage");

  return { canView, canCreate, canUpdate, canMarkPaid };
}

export function requireInvoiceView(session: AuthSession): void {
  if (!sessionHasPermission(session, "invoices", "view")) {
    throw new Error("Forbidden: invoices.view required");
  }
}
