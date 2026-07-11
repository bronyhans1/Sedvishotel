import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getShiftHandoverAccess } from "@/lib/auth/shift-handover-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getShiftHandoverService } from "@/lib/shift-handover/get-shift-handover-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ShiftHandoverPageData } from "@/types/shift-handover";

export async function loadShiftHandoverPageData(): Promise<
  ShiftHandoverPageData & { access: ReturnType<typeof getShiftHandoverAccess> }
> {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getShiftHandoverAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getShiftHandoverService();
  const pageData = await service.loadPageData(ctx, session);

  return { ...pageData, access };
}

export async function loadShiftHandoverAttentionCount(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  try {
    const { session, ctx } = await getServiceContextForPage();
    const access = getShiftHandoverAccess(session);
    if (!access.canView) {
      return 0;
    }
    const service = await getShiftHandoverService();
    return service.getAttentionCount(ctx, session);
  } catch {
    return 0;
  }
}

export async function loadPendingHandoverAcknowledgement() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { session, ctx } = await getServiceContextForPage();
    const access = getShiftHandoverAccess(session);
    if (!access.canView) {
      return null;
    }
    const service = await getShiftHandoverService();
    const pageData = await service.loadPageData(ctx, session);
    if (!pageData.pendingAcknowledgement) {
      return null;
    }
    return {
      shift: pageData.pendingAcknowledgement,
      pendingTasks: pageData.pendingAckTasks,
      openIssues: pageData.pendingAckIssues,
      access,
    };
  } catch {
    return null;
  }
}
