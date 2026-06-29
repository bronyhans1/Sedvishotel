import Image from "next/image";

import { cn } from "@/lib/utils";

type LoaderLogoSize = "sm" | "md" | "lg";

const sizeMap: Record<
  LoaderLogoSize,
  { className: string; width: number; height: number }
> = {
  sm: { className: "h-6 w-6", width: 24, height: 24 },
  md: { className: "h-8 w-8", width: 32, height: 32 },
  lg: { className: "h-12 w-12", width: 48, height: 48 },
};

type LoaderLogoProps = {
  size?: LoaderLogoSize;
  className?: string;
};

export function LoaderLogo({ size = "md", className }: LoaderLogoProps) {
  const s = sizeMap[size];

  return (
    <Image
      src="/loading_logo.png"
      alt="SHMS"
      width={s.width}
      height={s.height}
      className={cn(s.className, "object-contain animate-shms-pulse", className)}
      priority
    />
  );
}
