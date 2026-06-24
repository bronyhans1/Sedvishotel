"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Brand-gold top progress bar during dashboard route transitions.
 * Complements SHMSOverlayLoader without replacing table skeletons.
 */
export function SHMSProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(8);

    const ramp = window.setTimeout(() => setProgress(55), 80);
    const nearDone = window.setTimeout(() => setProgress(88), 200);
    const complete = window.setTimeout(() => setProgress(100), 300);
    const hide = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 480);

    return () => {
      window.clearTimeout(ramp);
      window.clearTimeout(nearDone);
      window.clearTimeout(complete);
      window.clearTimeout(hide);
    };
  }, [pathname]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[210] h-1 overflow-hidden transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
      aria-hidden
    >
      <div
        className="h-full bg-brand-gold shadow-[0_0_10px_oklch(0.72_0.12_75/0.55)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
