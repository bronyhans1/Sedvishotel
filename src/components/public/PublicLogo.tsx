import Image from "next/image";

import { publicSiteConfig } from "@/config/public-site";
import { publicImages } from "@/lib/public/images";
import { cn } from "@/lib/utils";

type PublicLogoProps = {
  className?: string;
  imageClassName?: string;
  size?: number;
  showName?: boolean;
  nameClassName?: string;
};

export function PublicLogo({
  className,
  imageClassName,
  size = 40,
  showName = false,
  nameClassName,
}: PublicLogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src={publicImages.logo}
        alt={publicSiteConfig.name}
        width={size}
        height={size}
        className={cn("rounded-lg object-contain", imageClassName)}
        priority
      />
      {showName ? (
        <span className={cn("font-serif text-lg font-semibold tracking-wide", nameClassName)}>
          {publicSiteConfig.name}
        </span>
      ) : null}
    </span>
  );
}
