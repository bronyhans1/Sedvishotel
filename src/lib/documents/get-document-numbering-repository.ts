import { createServerClient } from "@/lib/supabase/server";
import { SupabaseDocumentNumberingRepository } from "@/repositories/supabase/document-numbering.repository";
import type { IDocumentNumberingRepository } from "@/repositories/document-numbering.repository";

export async function getDocumentNumberingRepository(): Promise<IDocumentNumberingRepository> {
  const client = await createServerClient();
  return new SupabaseDocumentNumberingRepository(client);
}
