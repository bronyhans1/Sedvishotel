import type { CurrentUser } from "@/lib/auth/current-user.types";

const ROLE_LABELS: Record<CurrentUser["role"], string> = {
  admin: "Admin",
  manager: "Manager",
  receptionist: "Receptionist",
  housekeeping: "Housekeeping",
};

export function formatRoleLabel(roleId: CurrentUser["role"]): string {
  return ROLE_LABELS[roleId] ?? roleId;
}

/** Display name: full_name when set, otherwise email. */
export function getUserDisplayName(user: CurrentUser): string {
  const name = user.fullName.trim();
  return name.length > 0 ? name : user.email;
}

/** Avatar initials from full name, or first two characters of email. */
export function getUserInitials(user: CurrentUser): string {
  const name = user.fullName.trim();
  if (name.length > 0) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}
