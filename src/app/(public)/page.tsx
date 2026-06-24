import type { Metadata } from "next";
import Link from "next/link";

import { AmenitiesSection } from "@/components/public/AmenitiesSection";
import { GalleryExperienceSection } from "@/components/public/GalleryExperienceSection";
import { HeroSection } from "@/components/public/HeroSection";
import { HotelStatsSection } from "@/components/public/HotelStatsSection";
import { PublicCTA } from "@/components/public/PublicCTA";
import { PublicRoomCard } from "@/components/public/PublicRoomCard";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { StickyBookingBar } from "@/components/public/StickyBookingBar";
import { TrustSection } from "@/components/public/TrustSection";
import { WhyChooseUs } from "@/components/public/WhyChooseUs";
import { Button } from "@/components/ui/button";
import { publicMetadata } from "@/config/public-site";
import { buildPublicMetadata } from "@/lib/public-seo";
import { featuredPublicRooms } from "@/lib/mock-data/public-rooms";

export const metadata: Metadata = buildPublicMetadata({
  title: publicMetadata.defaultTitle,
  description:
    "SEDVIS HOTEL — luxury accommodations in Ho, Volta Region, Ghana. Book your stay for comfort, elegance, and exceptional hospitality.",
  path: "/",
});

export default function HomePage() {
  return (
    <div className="public-home-page">
      <HeroSection />
      <StickyBookingBar />
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
              </div>
              <Button variant="outline" asChild className="public-btn-lift">
                <Link href="/rooms">View All Rooms</Link>
              </Button>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPublicRooms.map((room) => (
                <PublicRoomCard key={room.id} room={room} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
      <AmenitiesSection />
      <WhyChooseUs />
      <GalleryExperienceSection />
      <PublicCTA />
    </div>
  );
}
