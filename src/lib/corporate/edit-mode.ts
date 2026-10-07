/** Detail page opens the existing company form only for this query and an editor. */
export function isCorporateEditMode(
  editParam: string | string[] | undefined,
  canEdit: boolean
): boolean {
  const value = Array.isArray(editParam) ? editParam[0] : editParam;
  return canEdit && value === "1";
}

/** Fields updateCompany already accepts. Account number and ledger values are not included. */
export const CORPORATE_EDITABLE_FIELDS = [
  "companyName",
  "billingContactName",
  "billingContactEmail",
  "billingContactPhone",
  "billingAddress",
  "creditLimit",
  "creditTerms",
  "notes",
] as const;
