import { redirect } from "next/navigation";

/** Legacy diagnostics page — not used as default redirect target. */
export const ACCESS_DENIED_PAGE_PATH = "/dashboard/access-denied";

/** Unauthorized users are sent to the dashboard (no access-denied flash during normal nav). */
export const ACCESS_DENIED_PATH = "/dashboard";

/** Redirect unauthorized users without throwing visible runtime errors. */
export function redirectIfUnauthorized(canAccess: boolean): void {
  if (!canAccess) {
    redirect(ACCESS_DENIED_PATH);
  }
}
