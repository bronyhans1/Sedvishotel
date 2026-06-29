"use client";

import { ScrollReveal } from "@/components/public/ScrollReveal";
import { hotelBrandPillars } from "@/config/hotel-information";

function BrandPillar({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <div className="text-center">
      <p className="font-serif text-4xl font-bold text-brand-gold sm:text-5xl">
        {primary}
      </p>
      <p className="mt-2 text-sm font-medium uppercase tracking-wider text-white/80">
        {secondary}
      </p>
    </div>
  );
}

export function HotelStatsSection() {
  return (
    <section className="bg-brand-navy py-16 text-white sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {hotelBrandPillars.map((pillar) => (
              <BrandPillar
                key={pillar.secondary}
                primary={pillar.primary}
                secondary={pillar.secondary}
              />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
