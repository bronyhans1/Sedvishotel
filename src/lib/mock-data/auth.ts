/**
 * @deprecated Dev auth credentials moved to server-only `src/lib/auth/dev-auth.ts`.
 * Retained for legacy mock fixtures only — not used for authentication.
 */
import type { UserSession } from "@/types";

export const mockUser: UserSession = {
  id: "usr_001",
  email: "admin@sedvis-hotel.com",
  fullName: "Alexandra Reed",
  role: "admin",
};
