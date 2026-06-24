"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getServiceContext } from "@/lib/auth/service-context";
import { getStaffService } from "@/lib/staff/get-staff-service";
import type { CreateStaffInput, StaffMember, UpdateStaffInput } from "@/types/staff";

export type StaffActionResult =
  | { success: true; temporaryPassword?: string; profileId?: string; member?: StaffMember }
  | { success: false; error: string };

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function revalidateStaff() {
  revalidatePath("/dashboard/staff");
}

export async function createStaffAction(
  input: CreateStaffInput
): Promise<StaffActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getStaffService();
    const result = await service.createStaff(ctx, session, input);
    revalidateStaff();
    return {
      success: true,
      temporaryPassword: result.temporaryPassword,
      profileId: result.member.id,
      member: result.member,
    };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function updateStaffAction(
  profileId: string,
  input: UpdateStaffInput
): Promise<StaffActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getStaffService();
    await service.updateStaff(ctx, session, profileId, input);
    revalidatePath(`/dashboard/staff/${profileId}`);
    revalidateStaff();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function suspendStaffAction(profileId: string): Promise<StaffActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getStaffService();
    await service.suspendStaff(ctx, session, profileId);
    revalidatePath(`/dashboard/staff/${profileId}`);
    revalidateStaff();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function activateStaffAction(profileId: string): Promise<StaffActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getStaffService();
    await service.activateStaff(ctx, session, profileId);
    revalidatePath(`/dashboard/staff/${profileId}`);
    revalidateStaff();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function resetStaffPasswordAction(
  profileId: string
): Promise<StaffActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getStaffService();
    const result = await service.resetPassword(ctx, session, profileId);
    return { success: true, temporaryPassword: result.temporaryPassword };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function uploadStaffAvatarAction(
  profileId: string,
  formData: FormData
): Promise<StaffActionResult> {
  try {
    const file = formData.get("avatar");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please select an image file." };
    }
    if (!AVATAR_TYPES.has(file.type)) {
      return { success: false, error: "Use JPEG, PNG, or WebP." };
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return { success: false, error: "Image must be 2 MB or smaller." };
    }

    const { session, ctx } = await getServiceContext();
    const service = await getStaffService();
    const buffer = await file.arrayBuffer();
    await service.uploadAvatar(
      ctx,
      session,
      profileId,
      file.name,
      buffer,
      file.type
    );
    revalidatePath(`/dashboard/staff/${profileId}`);
    revalidateStaff();
    revalidatePath("/dashboard", "layout");
    return { success: true, profileId };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function removeStaffAvatarAction(
  profileId: string
): Promise<StaffActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getStaffService();
    await service.removeAvatar(ctx, session, profileId);
    revalidatePath(`/dashboard/staff/${profileId}`);
    revalidateStaff();
    revalidatePath("/dashboard", "layout");
    return { success: true, profileId };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
