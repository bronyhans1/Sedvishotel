"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import type { BrandingConfig } from "@/lib/branding/types";

const THEME_STORAGE_KEY = "theme";

/**
 * Applies the hotel default theme once when the user has no saved preference.
 * Runtime theme changes use next-themes only (navbar / settings preview).
 */
export function ThemeBootstrap({
  defaultTheme,
}: {
  defaultTheme: BrandingConfig["theme"];
}) {
  const { setTheme } = useTheme();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) return;
    } catch {
      // Ignore storage access errors.
    }

    setTheme(defaultTheme);
  }, [defaultTheme, setTheme]);

  return null;
}
