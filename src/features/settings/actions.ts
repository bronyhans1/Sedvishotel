"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { revalidatePublicWebsite } from "@/lib/public/revalidate-public-website";
import { getSettingsAccess } from "@/lib/auth/settings-access";
import { getServiceContext } from "@/lib/auth/service-context";
import { StorageBuckets } from "@/lib/database/storage";
import { getSettingsService } from "@/lib/settings/get-settings-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import type { HotelSettings } from "@/types/settings";

export type SettingsActionResult =
  | { success: true; url?: string }
  | { success: false; error: string };

const BRAND_MAX_BYTES = 2 * 1024 * 1024;
const BRAND_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"]);

function revalidateBranding() {
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/login");
  revalidatePublicWebsite();
}

export async function saveSettingsAction(
  settings: HotelSettings
): Promise<SettingsActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getSettingsService();
    await service.updateHotelSettings(ctx, session, settings);
    revalidateBranding();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function uploadBrandingAssetAction(
  formData: FormData,
  asset: "logo" | "favicon"
): Promise<SettingsActionResult> {
  try {
    if (!supabaseEnv.serviceRoleKey) {
      return { success: false, error: "Branding upload requires service role configuration." };
    }

    const { session, ctx } = await getServiceContext();
    if (!getSettingsAccess(session).canManage) {
      return { success: false, error: "Forbidden: settings edit required." };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose a file to upload." };
    }
    if (!BRAND_TYPES.has(file.type)) {
      return { success: false, error: "Use JPEG, PNG, WebP, or ICO." };
    }
    if (file.size > BRAND_MAX_BYTES) {
      return { success: false, error: "File must be 2 MB or smaller." };
    }

    const admin = createAdminClient();
    const path = asset === "logo" ? "branding/logo" : "branding/favicon";
    const buffer = await file.arrayBuffer();
    const { error } = await admin.storage
      .from(StorageBuckets.hotelAssets)
      .upload(path, buffer, { upsert: true, contentType: file.type });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data } = admin.storage.from(StorageBuckets.hotelAssets).getPublicUrl(path);
    const service = await getSettingsService();
    const current = await service.getHotelSettings(ctx, session);
    const next =
      asset === "logo"
        ? { ...current, logoUrl: data.publicUrl }
        : { ...current, faviconUrl: data.publicUrl };
    await service.updateHotelSettings(ctx, session, next);
    revalidateBranding();
    return { success: true, url: data.publicUrl };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
