import Image from "next/image";

import { PublicBookButton } from "@/components/public/PublicBookButton";
import { publicSiteConfig } from "@/config/public-site";
import { publicImages } from "@/lib/public/images";

export function HeroSection() {
  return (
    <section className="relative min-h-[72vh] overflow-hidden sm:min-h-[75vh]">
      <div className="absolute inset-0 public-hero-ken-burns">
        <Image
          src={publicImages.hero}
          alt="SEDVIS HOTEL luxury hospitality"
          fill
          priority
          className="object-cover brightness-[1.06] saturate-[1.03]"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/65 via-brand-navy/25 to-transparent" />
      <div className="relative mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-center px-4 py-20 sm:min-h-[75vh] sm:px-6 sm:py-22 lg:px-8">
        <div className="public-animate-fade-up mb-6 w-fit max-w-full">
          <div className="public-hero-eyebrow-pill inline-flex flex-col rounded-full px-5 py-3.5">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-gold public-hero-text-shadow">
              Luxury Hospitality · Ho, Volta Region
            </p>
            <div className="mt-3 h-0.5 w-20 bg-brand-gold" aria-hidden />
          </div>
        </div>
        <h1 className="public-animate-fade-up public-delay-1 max-w-2xl font-serif text-4xl font-bold leading-tight text-white public-hero-text-shadow sm:text-5xl lg:text-6xl">
          <span className="block">Welcome to</span>
          <span className="block">{publicSiteConfig.name}</span>
        </h1>
        <p className="public-animate-fade-up public-delay-2 mt-5 max-w-xl text-lg leading-relaxed text-white/85 public-hero-text-shadow sm:text-xl">
          {publicSiteConfig.heroSubheadline}
        </p>
        <div className="public-animate-fade-up public-delay-3 mt-8 flex w-full max-w-full flex-wrap gap-3 sm:mt-10 sm:gap-4">
          <PublicBookButton size="lg" showIcon />
          <PublicBookButton
            href="/rooms"
            label="Explore Rooms"
            variant="hero-outline"
            size="lg"
          />
        </div>
      </div>
    </section>
  );
}
