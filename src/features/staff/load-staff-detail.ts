import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getStaffAccess } from "@/lib/auth/staff-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getActivityLogService } from "@/lib/logs/get-activity-log-service";
import { getRoleService } from "@/lib/roles/get-role-service";
import { getStaffService } from "@/lib/staff/get-staff-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadStaffDetailData(profileId: string) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getStaffAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const staffService = await getStaffService();
  const member = await staffService.getStaffById(ctx, session, profileId);
  if (!member) {
    return null;
  }

  const roleService = await getRoleService();
  const logService = await getActivityLogService();

  const [permissionCount, permissionCodes, activityResult] = await Promise.all([
    roleService.getPermissionCountForRole(ctx, session, member.role),
    roleService.getPermissionsForRole(ctx, session, member.role),
    logService.listLogs(ctx, session, { userId: member.userId }),
  ]);

  return {
    member,
    access,
    permissionCount,
    permissionCodes,
    activity: activityResult.logs.slice(0, 20),
  };
}
