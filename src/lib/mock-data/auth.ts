import type { UserSession } from "@/types";

export const mockCredentials = {
  email: "admin@sedvis-hotel.com",
  password: "sedvis2026",
} as const;

export const mockUser: UserSession = {
  id: "usr_001",
  email: mockCredentials.email,
  fullName: "Alexandra Reed",
  role: "admin",
};
