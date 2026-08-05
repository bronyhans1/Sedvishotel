import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getNightAuditAccess } from "@/lib/auth/night-audit-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { getNightAuditService } from "@/lib/night-audit/get-night-audit-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { NightAudit, NightAuditRevision, NightAuditSnapshot } from "@/types/night-audit";

export async function loadNightAuditDetailData(ref: string): Promise<{
  audit: NightAudit;
  access: ReturnType<typeof getNightAuditAccess>;
  liveSnapshot: NightAuditSnapshot | null;
  revisions: NightAuditRevision[];
  isToday: boolean;
}> {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getNightAuditAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getNightAuditService();
  const decoded = decodeURIComponent(ref);
  const audit =
    decoded.startsWith("NA-")
      ? await service.getAuditByNumber(ctx, session, decoded)
      : /^\d{4}-\d{2}-\d{2}$/.test(decoded)
        ? await service.getAuditByDate(ctx, session, decoded)
        : null;

  if (!audit) {
    notFound();
  }

  const isToday = audit.auditDate === (await getCurrentBusinessDate());
  const liveSnapshot =
    audit.status === "open"
      ? await service.generateSnapshot(ctx, session, audit.auditDate)
      : null;

  const revisions = access.canViewRevisions
    ? await service.listRevisions(ctx, session, audit.auditNumber)
    : [];

  return { audit, access, liveSnapshot, revisions, isToday };
}
