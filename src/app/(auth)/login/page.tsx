import type { Metadata } from "next";

import { LoginPageClient } from "@/features/auth/components/LoginPageClient";
import { resolveLoginPageError } from "@/lib/auth/auth-config";
import { getDevAuthCredentialHint } from "@/lib/auth/dev-auth";
import { loadBranding } from "@/lib/branding/load-branding";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Staff Sign In | SHMS",
  description: `Staff portal sign in for ${siteConfig.fullName}`,
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const branding = await loadBranding();
  const devAuthHint = getDevAuthCredentialHint();
  const initialError = resolveLoginPageError(params.error);

  return (
    <LoginPageClient
      branding={branding}
      devAuthHint={devAuthHint}
      initialError={initialError}
    />
  );
}
