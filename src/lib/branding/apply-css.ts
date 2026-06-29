import type { BrandingConfig } from "@/lib/branding/types";

/** Apply branding colors to CSS custom properties on the document root */
export function applyBrandingCss(branding: BrandingConfig): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--brand-navy", branding.primaryColor);
  root.style.setProperty("--brand-gold", branding.secondaryColor);
  root.style.setProperty("--primary", branding.primaryColor);
  root.style.setProperty("--ring", branding.secondaryColor);
  root.style.setProperty("--accent", branding.secondaryColor);
  root.style.setProperty("--sidebar-accent", branding.primaryColor);
}

export function clearBrandingCss(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const prop of [
    "--brand-navy",
    "--brand-gold",
    "--primary",
    "--ring",
    "--accent",
    "--sidebar-accent",
  ]) {
    root.style.removeProperty(prop);
  }
}
