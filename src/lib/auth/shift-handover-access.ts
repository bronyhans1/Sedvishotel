import { sessionHasPermission } from "@/lib/auth/permissions";
import type { ShiftHandoverAccess } from "@/lib/auth/shift-handover-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getShiftHandoverAccess(session: AuthSession): ShiftHandoverAccess {
  const canView = sessionHasPermission(session, "shift_handover", "view");
  const canOpenShift = sessionHasPermission(session, "shift_handover", "create");
  const canCloseShift = sessionHasPermission(session, "shift_handover", "edit");
  return { canView, canOpenShift, canCloseShift };
}
