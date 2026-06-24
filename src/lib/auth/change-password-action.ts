"use server";

import { redirect, unstable_rethrow } from "next/navigation";

import { getAuthService } from "@/lib/auth/get-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ServiceError } from "@/services/types";

export type ChangePasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function changePasswordAction(
  newPassword: string,
  confirmPassword: string
): Promise<ChangePasswordResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase is not configured." };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  try {
    const auth = await getAuthService();
    await auth.changePassword(newPassword);
    redirect("/dashboard");
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Failed to update password." };
  }
}
