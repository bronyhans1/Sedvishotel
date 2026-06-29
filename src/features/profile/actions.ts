"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getServiceContext } from "@/lib/auth/service-context";
import { getProfileService } from "@/lib/profile/get-profile-service";
import type {
  ChangeOwnPasswordInput,
  UpdateOwnProfileInput,
  UserProfile,
} from "@/types/profile";

export type ProfileActionResult =
  | { success: true; profile?: UserProfile }
  | { success: false; error: string };

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function revalidateProfile() {
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard", "layout");
}

export async function updateOwnProfileAction(
  input: UpdateOwnProfileInput
): Promise<ProfileActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProfileService();
    const profile = await service.updateOwnProfile(ctx, session, input);
    revalidateProfile();
    return { success: true, profile };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function changeOwnPasswordAction(
  input: ChangeOwnPasswordInput
): Promise<ProfileActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProfileService();
    await service.changeOwnPassword(ctx, session, input);
    revalidateProfile();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function uploadOwnAvatarAction(
  formData: FormData
): Promise<ProfileActionResult> {
  try {
    const file = formData.get("avatar");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose a photo to upload." };
    }
    if (!AVATAR_TYPES.has(file.type)) {
      return { success: false, error: "Photo must be JPEG, PNG, or WebP." };
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return { success: false, error: "Photo must be 2 MB or smaller." };
    }

    const { session, ctx } = await getServiceContext();
    const service = await getProfileService();
    const profile = await service.uploadOwnAvatar(
      ctx,
      session,
      file.name,
      await file.arrayBuffer(),
      file.type
    );
    revalidateProfile();
    return { success: true, profile };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function removeOwnAvatarAction(): Promise<ProfileActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getProfileService();
    const profile = await service.removeOwnAvatar(ctx, session);
    revalidateProfile();
    return { success: true, profile };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
