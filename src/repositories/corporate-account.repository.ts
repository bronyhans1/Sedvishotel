import type { DbCorporateAccount } from "@/types/database";
import type { CorporateAccountSearchFilters } from "@/types/corporate-account";

export interface ICorporateAccountRepository {
  getById(id: string): Promise<DbCorporateAccount | null>;
  getByAccountNumber(accountNumber: string): Promise<DbCorporateAccount | null>;
  list(filters?: CorporateAccountSearchFilters): Promise<DbCorporateAccount[]>;
  search(query: string): Promise<DbCorporateAccount[]>;
  create(
    data: Omit<DbCorporateAccount, "id" | "created_at" | "updated_at" | "account_number">
  ): Promise<DbCorporateAccount>;
  update(id: string, data: Partial<DbCorporateAccount>): Promise<DbCorporateAccount>;
  nextAccountNumber(): Promise<string>;
}
