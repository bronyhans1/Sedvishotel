"use client";

import { createContext, useContext, useEffect } from "react";

import { applyBrandingCss } from "@/lib/branding/apply-css";
import type { BrandingConfig } from "@/lib/branding/types";
import { ThemeBootstrap } from "@/components/theme/ThemeBootstrap";

const BrandingContext = createContext<BrandingConfig | null>(null);

export function useBranding(): BrandingConfig | null {
  return useContext(BrandingContext);
}

export function BrandingProvider({
  branding,
  children,
}: {
  branding: BrandingConfig;
  children: React.ReactNode;
}) {
  useEffect(() => {
    applyBrandingCss(branding);
  }, [branding]);

  return (
    <BrandingContext.Provider value={branding}>
      <ThemeBootstrap defaultTheme={branding.theme} />
      {children}
    </BrandingContext.Provider>
  );
}
