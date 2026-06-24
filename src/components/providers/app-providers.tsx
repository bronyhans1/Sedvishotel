"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/hooks/use-toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
