"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";

import { useBranding } from "@/components/branding/BrandingProvider";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type HotelLogoProps = {
  className?: string;
  iconClassName?: string;
  showName?: boolean;
  nameClassName?: string;
};

export function HotelLogo({
  className,
  iconClassName,
  showName = false,
  nameClassName,
}: HotelLogoProps) {
  const branding = useBranding();
  const name = branding?.hotelName ?? siteConfig.name;

  if (branding?.logoUrl) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Image
          src={branding.logoUrl}
          alt={`${name} logo`}
          width={80}
          height={80}
          className={cn("h-10 w-10 rounded-lg object-contain", iconClassName)}
          unoptimized
        />
        {showName ? (
          <span className={cn("font-semibold", nameClassName)}>{name}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold/20 text-brand-gold",
          iconClassName
        )}
      >
        <Building2 className="h-5 w-5" />
      </span>
      {showName ? (
        <span className={cn("font-semibold", nameClassName)}>{name}</span>
      ) : null}
    </div>
  );
}
