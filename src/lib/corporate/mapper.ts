import type { DbCorporateAccount } from "@/types/database";
import type { CorporateAccount } from "@/types/corporate-account";

export function mapDbCorporateAccountToCorporateAccount(
  row: DbCorporateAccount
): CorporateAccount {
  return {
    id: row.id,
    accountNumber: row.account_number,
    companyName: row.company_name,
    billingContactName: row.billing_contact_name,
    billingContactEmail: row.billing_contact_email,
    billingContactPhone: row.billing_contact_phone,
    billingAddress: row.billing_address,
    creditLimit: row.credit_limit != null ? Number(row.credit_limit) : null,
    creditTerms: row.credit_terms,
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
