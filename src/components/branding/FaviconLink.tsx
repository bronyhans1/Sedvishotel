"use client";

import { useEffect } from "react";

import { useBranding } from "@/components/branding/BrandingProvider";

export function FaviconLink() {
  const branding = useBranding();

  useEffect(() => {
    if (!branding?.faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl;
  }, [branding?.faviconUrl]);

  return null;
}
