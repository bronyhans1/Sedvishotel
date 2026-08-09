"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  active: boolean;
  priority?: boolean;
  /** When true, skip Ken Burns for reduced motion. */
  reducedMotion?: boolean;
};

/**
 * Single full-bleed hero layer with subtle Ken Burns zoom while active.
 */
export function HeroImage({
  src,
  alt,
  active,
  priority = false,
  reducedMotion = false,
}: Props) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden transition-opacity ease-in-out",
        active ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{ transitionDuration: "1400ms" }}
      aria-hidden={!active}
    >
      <div
        className={cn(
          "absolute inset-0 will-change-transform",
          active && !reducedMotion && "public-hero-slide-ken-burns"
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover object-center brightness-[1.04] saturate-[1.02]"
          sizes="100vw"
        />
      </div>
    </div>
  );
}
