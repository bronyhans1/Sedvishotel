import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";
import { DocumentConfigService } from "@/services/document-config.service";

/**
 * Factory for the runtime document configuration service.
 *
 * Reuses the existing settings repository. Reads document/branding
 * configuration WITHOUT requiring `settings.view`, so operational staff
 * (Reception, Manager, etc.) can render receipts and invoices.
 */
export async function getDocumentConfigService(): Promise<DocumentConfigService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new DocumentConfigService(new SupabaseSettingsRepository(client));
}
