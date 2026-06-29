import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { StorageBuckets, StoragePaths } from "@/lib/database/storage";
import type { SupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadProductImage(
  client: SupabaseServerClient,
  productId: string,
  file: File
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Image must be JPEG, PNG, or WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = StoragePaths.productImage(productId, `cover.${ext}`);
  const buffer = Buffer.from(await file.arrayBuffer());

  const storageClient = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : client;

  const { error } = await storageClient.storage
    .from(StorageBuckets.productImages)
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Failed to upload product image: ${error.message}`);
  }

  return path;
}

export async function removeProductImage(
  client: SupabaseServerClient,
  storagePath: string
): Promise<void> {
  const storageClient = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : client;

  const { error } = await storageClient.storage
    .from(StorageBuckets.productImages)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Failed to remove product image: ${error.message}`);
  }
}
