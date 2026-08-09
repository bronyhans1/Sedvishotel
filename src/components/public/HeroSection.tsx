import { HeroOverlay } from "@/components/public/HeroOverlay";
import { HeroSlider } from "@/components/public/HeroSlider";
import { LuxuryButton } from "@/components/public/LuxuryButton";
import { publicSiteConfig } from "@/config/public-site";
import { homepageHeroSlides } from "@/lib/public/homepage-images";

export function HeroSection() {
  return (
    <section className="relative min-h-[78vh] overflow-hidden sm:min-h-[82vh] lg:min-h-[88vh]">
      <HeroSlider slides={homepageHeroSlides} />
      <HeroOverlay />

      <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-4 pb-28 pt-24 sm:min-h-[82vh] sm:px-6 sm:pb-32 sm:pt-28 lg:min-h-[88vh] lg:px-8 lg:pb-36">
        <div className="public-animate-fade-up mb-7 w-fit max-w-full">
          <div className="public-hero-eyebrow-pill inline-flex flex-col rounded-full px-5 py-3.5">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-gold public-hero-text-shadow">
              Luxury Hospitality · Ho, Volta Region
            </p>
            <div className="mt-3 h-0.5 w-20 bg-brand-gold" aria-hidden />
          </div>
        </div>

        <h1 className="public-animate-fade-up public-delay-1 max-w-3xl font-serif text-[2.65rem] font-bold leading-[1.08] tracking-tight text-white public-hero-text-shadow sm:text-5xl lg:text-6xl xl:text-7xl">
          <span className="block text-[0.55em] font-semibold uppercase tracking-[0.22em] text-white/90">
            Welcome to
          </span>
          <span className="mt-3 block">{publicSiteConfig.name}</span>
        </h1>

        <p className="public-animate-fade-up public-delay-2 mt-6 max-w-xl text-lg leading-relaxed text-white/88 public-hero-text-shadow sm:mt-7 sm:text-xl sm:leading-relaxed">
          {publicSiteConfig.heroSubheadline}
        </p>

        <div className="public-animate-fade-up public-delay-3 mt-9 flex w-full max-w-full flex-wrap gap-3 sm:mt-11 sm:gap-4">
          <LuxuryButton href="/book" label="Book Now" size="lg" showIcon />
          <LuxuryButton
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
