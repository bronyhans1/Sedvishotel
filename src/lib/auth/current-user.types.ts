import type { DbRoleId } from "@/types/database/enums";

/** Serializable staff user for Client Components (props from Server Components). */
export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: DbRoleId;
  mustChangePassword?: boolean;
  /** Live permission codes from role_permissions — drives sidebar filtering. */
  permissions: string[];
  avatarUrl?: string | null;
};
