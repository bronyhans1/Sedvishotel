import type { Metadata } from "next";

import { LoginPageClient } from "@/features/auth/components/LoginPageClient";
import { loadBranding } from "@/lib/branding/load-branding";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Staff Sign In | SHMS",
  description: `Staff portal sign in for ${siteConfig.fullName}`,
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const branding = await loadBranding();
  return <LoginPageClient branding={branding} />;
}
