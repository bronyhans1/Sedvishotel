"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { SHMSOverlayLoader } from "@/components/loading/SHMSOverlayLoader";

/**
 * Brief branded overlay when navigating between dashboard routes.
 * Works alongside segment loading.tsx and table skeletons.
 */
export function DashboardRouteTransition() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 320);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  return <SHMSOverlayLoader variant="overlay" message="Loading..." />;
}
