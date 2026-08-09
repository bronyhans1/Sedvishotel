"use client";

import { useEffect, useState } from "react";

import { HeroImage } from "@/components/public/HeroImage";
import {
  HERO_CROSSFADE_MS,
  HERO_SLIDE_DURATION_MS,
  type HomepageHeroSlide,
} from "@/lib/public/homepage-images";

type Props = {
  slides: HomepageHeroSlide[];
};

/**
 * Slow crossfade cinematic slideshow with subtle Ken Burns.
 * Preloads only the next slide via priority/eager; others lazy via next/image defaults.
 */
export function HeroSlider({ slides }: Props) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [loadedNext, setLoadedNext] = useState<Set<number>>(() => new Set([0, 1]));

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (reducedMotion) return;

    const id = window.setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % slides.length;
        setLoadedNext((prev) => {
          const copy = new Set(prev);
          copy.add(next);
          copy.add((next + 1) % slides.length);
          return copy;
        });
        return next;
      });
    }, HERO_SLIDE_DURATION_MS);

    return () => window.clearInterval(id);
  }, [slides.length, reducedMotion]);

  if (slides.length === 0) return null;

  const active = reducedMotion ? 0 : index;

  return (
    <div
      className="absolute inset-0"
      role="img"
      aria-label={slides[active]?.alt ?? "Hotel photography"}
      style={{ ["--hero-crossfade" as string]: `${HERO_CROSSFADE_MS}ms` }}
    >
      {slides.map((slide, i) => {
        const shouldRender = loadedNext.has(i) || i === active || i === 0;
        if (!shouldRender) return null;
        return (
          <HeroImage
            key={slide.id}
            src={slide.src}
            alt={slide.alt}
            active={i === active}
            priority={i === 0}
            reducedMotion={reducedMotion}
          />
        );
      })}
    </div>
  );
}
