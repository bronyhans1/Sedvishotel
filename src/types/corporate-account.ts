export type CorporateAccountStatus = "active" | "archived";

export type CorporateAccount = {
  id: string;
  accountNumber: string;
  companyName: string;
  billingContactName: string | null;
  billingContactEmail: string | null;
  billingContactPhone: string | null;
  billingAddress: string | null;
  creditLimit: number | null;
  creditTerms: string | null;
  status: CorporateAccountStatus;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CorporateAccountFormValues = {
  companyName: string;
  billingContactName?: string;
  billingContactEmail?: string;
  billingContactPhone?: string;
  billingAddress?: string;
  creditLimit?: number | null;
  creditTerms?: string;
  notes?: string;
};

export type CorporateAccountSearchFilters = {
  query?: string;
  status?: CorporateAccountStatus;
};
