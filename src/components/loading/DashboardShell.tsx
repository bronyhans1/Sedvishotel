"use client";

import { DashboardRouteTransition } from "@/components/loading/DashboardRouteTransition";
import { SHMSProgressBar } from "@/components/loading/SHMSProgressBar";

/** Client shell for dashboard — progress bar, route overlay, children. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SHMSProgressBar />
      <DashboardRouteTransition />
      {children}
    </>
  );
}
