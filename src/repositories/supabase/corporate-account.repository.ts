import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { ICorporateAccountRepository } from "@/repositories/corporate-account.repository";
import type { DbCorporateAccount } from "@/types/database";
import type { CorporateAccountSearchFilters } from "@/types/corporate-account";

export class SupabaseCorporateAccountRepository implements ICorporateAccountRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getById(id: string): Promise<DbCorporateAccount | null> {
    const { data, error } = await this.client
      .from("corporate_accounts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Failed to load corporate account: ${error.message}`);
    return data;
  }

  async getByAccountNumber(accountNumber: string): Promise<DbCorporateAccount | null> {
    const { data, error } = await this.client
      .from("corporate_accounts")
      .select("*")
      .eq("account_number", accountNumber)
      .maybeSingle();
    if (error) throw new Error(`Failed to load corporate account: ${error.message}`);
    return data;
  }

  async list(filters?: CorporateAccountSearchFilters): Promise<DbCorporateAccount[]> {
    let query = this.client.from("corporate_accounts").select("*").order("company_name");
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.query?.trim()) {
      const q = `%${filters.query.trim()}%`;
      query = query.or(
        `company_name.ilike.${q},account_number.ilike.${q},billing_contact_name.ilike.${q},billing_contact_email.ilike.${q}`
      );
    }
    const { data, error } = await query;
    if (error) throw new Error(`Failed to list corporate accounts: ${error.message}`);
    return data ?? [];
  }

  async search(query: string): Promise<DbCorporateAccount[]> {
    return this.list({ query, status: "active" });
  }

  async create(
    data: Omit<DbCorporateAccount, "id" | "created_at" | "updated_at" | "account_number">
  ): Promise<DbCorporateAccount> {
    const accountNumber = await this.nextAccountNumber();
    const { data: row, error } = await this.client
      .from("corporate_accounts")
      .insert({ ...data, account_number: accountNumber })
      .select("*")
      .single();
    if (error || !row) {
      throw new Error(`Failed to create corporate account: ${error?.message ?? "unknown"}`);
    }
    return row;
  }

  async update(id: string, data: Partial<DbCorporateAccount>): Promise<DbCorporateAccount> {
    const { data: row, error } = await this.client
      .from("corporate_accounts")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !row) {
      throw new Error(`Failed to update corporate account: ${error?.message ?? "unknown"}`);
    }
    return row;
  }

  async nextAccountNumber(): Promise<string> {
    const { data, error } = await this.client.rpc("shms_next_document_number", {
      p_kind: "corporate_account",
    });
    if (error || !data) {
      throw new Error(`Failed to generate corporate account number: ${error?.message ?? "unknown"}`);
    }
    return String(data);
  }
}
