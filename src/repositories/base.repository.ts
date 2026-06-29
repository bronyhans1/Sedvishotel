import type { SupabaseAdminClient, SupabaseServerClient } from "@/lib/supabase";

/**
 * Base repository — all data access goes through Supabase/Postgres.
 * Implementation deferred to integration milestone.
 */
export abstract class BaseRepository {
  constructor(
    protected readonly client: SupabaseServerClient | SupabaseAdminClient
  ) {}

  /** Placeholder for consistent error mapping */
  protected notImplemented(method: string): never {
    throw new Error(
      `${this.constructor.name}.${method} is not implemented — awaiting Supabase integration.`
    );
  }
}
