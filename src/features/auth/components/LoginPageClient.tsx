"use client";

import type { BrandingConfig } from "@/lib/branding/types";
import { BrandingProvider } from "@/components/branding/BrandingProvider";
import { FaviconLink } from "@/components/branding/FaviconLink";
import { HotelLogo } from "@/components/branding/HotelLogo";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { siteConfig } from "@/config/site";

export function LoginPageClient({
  branding,
  devAuthHint = null,
  initialError = null,
}: {
  branding: BrandingConfig;
  devAuthHint?: { email: string; password: string } | null;
  initialError?: string | null;
}) {
  const hotelName = branding.hotelName || siteConfig.name;

  return (
    <BrandingProvider branding={branding}>
      <FaviconLink />
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-navy/[0.07] via-background to-brand-gold/[0.12] dark:from-brand-navy/25 dark:via-background dark:to-brand-gold/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-brand-navy/10 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 mb-10 text-center">
          <div className="mb-6 flex justify-center">
            <HotelLogo iconClassName="h-20 w-20 rounded-xl" />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Welcome to
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {hotelName}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">Management System</p>
        </div>

        <div className="relative z-10 w-full max-w-md px-1">
          <LoginForm devAuthHint={devAuthHint} initialError={initialError} />
        </div>

        <div className="relative z-10 mt-8 space-y-0.5 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {hotelName}. All rights reserved.</p>
          <p className="text-muted-foreground/75">Developer: Brony Hans</p>
          <p className="text-muted-foreground/75">Version {siteConfig.version}</p>
        </div>
      </div>
    </BrandingProvider>
  );
}
