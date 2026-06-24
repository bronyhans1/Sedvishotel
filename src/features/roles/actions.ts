"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getServiceContext } from "@/lib/auth/service-context";
import { getRoleService } from "@/lib/roles/get-role-service";
import type { PermissionMatrix } from "@/types/role";

export type RoleActionResult =
  | { success: true }
  | { success: false; error: string };

export async function saveRolePermissionsAction(
  matrix: PermissionMatrix
): Promise<RoleActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getRoleService();
    await service.savePermissionMatrix(ctx, session, matrix);
    revalidatePath("/dashboard/roles");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
