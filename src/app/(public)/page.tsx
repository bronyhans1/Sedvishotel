import type { Metadata } from "next";
import Link from "next/link";

import { AmenitiesSection } from "@/components/public/AmenitiesSection";
import { FeaturedRoomCard } from "@/components/public/FeaturedRoomCard";
import { GalleryExperienceSection } from "@/components/public/GalleryExperienceSection";
import { HeroSection } from "@/components/public/HeroSection";
import { HotelStatsSection } from "@/components/public/HotelStatsSection";
import { PublicCTA } from "@/components/public/PublicCTA";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { StickyBookingBar } from "@/components/public/StickyBookingBar";
import { TrustSection } from "@/components/public/TrustSection";
import { WhyChooseUs } from "@/components/public/WhyChooseUs";
import { Button } from "@/components/ui/button";
import { homepageFeaturedSlots } from "@/lib/public/homepage-images";
import { loadPublicRooms } from "@/lib/public/load-public-rooms";
import { buildPublicMetadata } from "@/lib/public-seo";

export const metadata: Metadata = buildPublicMetadata({
  title: "SEDVIS HOTEL | Luxury Hotel in Ho, Volta Region",
  description:
    "SEDVIS HOTEL offers refined accommodation in Ho, Ghana — a luxury hotel in the Volta Region with elegant rooms, 24/7 reception, and exceptional hospitality. Book your stay today.",
  path: "/",
  keywords: [
    "SEDVIS HOTEL",
    "hotel in Ho",
    "hotel in Volta Region",
    "accommodation in Ho Ghana",
    "luxury hotel in Ho",
  ],
});

export default async function HomePage() {
  const publicRooms = await loadPublicRooms();
  const roomsBySlug = Object.fromEntries(
    publicRooms.map((room) => [room.slug, room])
  );

  return (
    <div className="public-home-page">
      <HeroSection />
      <StickyBookingBar floating />
      <TrustSection />
      <HotelStatsSection />
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
                  Accommodations
                </p>
                <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
                  Featured Rooms
                </h2>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
                  A curated look at our Standard and Deluxe experiences — with
                  Deluxe as the centerpiece of your stay.
                </p>
              </div>
              <Button
                variant="outline"
                asChild
                className="public-btn-lift border-brand-navy/20"
              >
                <Link href="/rooms">View All Rooms</Link>
              </Button>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid items-stretch gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:items-center lg:gap-6">
            {homepageFeaturedSlots.map((slot) => {
              const room = roomsBySlug[slot.roomSlug];
              if (!room) return null;
              return (
                <ScrollReveal
                  key={slot.id}
                  className={
                    slot.highlight ? "sm:col-span-2 lg:col-span-1" : undefined
                  }
                >
                  <FeaturedRoomCard
                    room={room}
                    imageSrc={slot.src}
                    highlight={Boolean(slot.highlight)}
                  />
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
      <AmenitiesSection />
      <WhyChooseUs />
      <GalleryExperienceSection />
      <PublicCTA />
    </div>
  );
}
