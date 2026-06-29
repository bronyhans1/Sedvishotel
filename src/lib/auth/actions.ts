"use server";

import { redirect, unstable_rethrow } from "next/navigation";

import {
  AUTH_CONFIGURATION_INCOMPLETE_MESSAGE,
  AUTH_SERVICE_UNAVAILABLE_MESSAGE,
} from "@/lib/auth/auth-config";
import {
  canUseDevAuthFallback,
  validateDevAuthCredentials,
} from "@/lib/auth/dev-auth";
import { authDebug } from "@/lib/auth/debug-log";
import { getAuthService } from "@/lib/auth/get-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ServiceError } from "@/services/types";

export type SignInResult =
  | { success: true }
  | { success: false; error: string };

export async function signInAction(
  email: string,
  password: string
): Promise<SignInResult> {
  if (!isSupabaseConfigured()) {
    if (canUseDevAuthFallback() && validateDevAuthCredentials(email, password)) {
      redirect("/dashboard");
    }
    return {
      success: false,
      error: canUseDevAuthFallback()
        ? "Invalid email or password."
        : AUTH_CONFIGURATION_INCOMPLETE_MESSAGE,
    };
  }

  try {
    const auth = await getAuthService();
    const session = await auth.signIn(email, password);

    authDebug("signInAction.redirect", {
      reason: "sign_in_ok",
      to: session.mustChangePassword ? "/change-password" : "/dashboard",
    });
    redirect(session.mustChangePassword ? "/change-password" : "/dashboard");
  } catch (err) {
    unstable_rethrow(err);

    if (
      err instanceof ServiceError &&
      err.code === "STAFF_PROFILE_MISSING"
    ) {
      try {
        const auth = await getAuthService();
        await auth.signOut();
        authDebug("signInAction.signOut", {
          reason: "staff_profile_missing_after_auth",
        });
      } catch (cleanupErr) {
        unstable_rethrow(cleanupErr);
      }
    }
    if (err instanceof ServiceError) {
      authDebug("signInAction.error", { code: err.code, message: err.message });
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: AUTH_SERVICE_UNAVAILABLE_MESSAGE };
  }
}

export async function signOutAction(): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/login");
    return;
  }

  const auth = await getAuthService();
  await auth.signOut();
  redirect("/login");
}
