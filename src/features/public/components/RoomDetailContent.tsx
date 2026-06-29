"use client";

import Image from "next/image";
import { useState } from "react";
import {
  BedDouble,
  Clock,
  MonitorPlay,
  Shield,
  Sparkles,
  Users,
  Wind,
} from "lucide-react";

import { BookingWidget } from "@/components/public/BookingWidget";
import { PublicBookButton, bookLabels } from "@/components/public/PublicBookButton";
import { PublicPageCTAs } from "@/components/public/PublicPageCTAs";
import { RelatedRoomsCarousel } from "@/components/public/RelatedRoomsCarousel";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { hotelPolicies } from "@/config/hotel-policies";
import { getBedPreferenceLabel, type PublicBedPreferenceId } from "@/lib/public/room-categories";
import { formatCurrency } from "@/lib/utils";
import type { PublicRoom } from "@/types/public";

type Props = {
  room: PublicRoom;
  related: PublicRoom[];
  catalogRooms: PublicRoom[];
};

export function RoomDetailContent({ room, related, catalogRooms }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const whyYoullLoveIt: {
    icon: typeof BedDouble;
    label: string;
  }[] = [
    { icon: BedDouble, label: "Comfortable sleep in a quiet atmosphere" },
    { icon: Wind, label: "Air conditioning for all-day comfort" },
    { icon: MonitorPlay, label: "Smart TV for easy in-room entertainment" },
    { icon: Sparkles, label: "Daily housekeeping for a fresh, welcoming space" },
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="relative block aspect-[16/10] w-full overflow-hidden rounded-3xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              <Image
                src={room.images[activeImage]}
                alt={room.name}
                fill
                className="object-cover transition-opacity duration-300"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            </button>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {room.images.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    i === activeImage ? "border-brand-gold ring-2 ring-brand-gold/30" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="112px" />
                </button>
              ))}
            </div>

            <ScrollReveal>
              <h1 className="mt-8 font-serif text-3xl font-bold sm:text-4xl">{room.name}</h1>
              <p className="mt-2 text-2xl font-semibold text-brand-navy">
                {formatCurrency(room.pricePerNight)}
                <span className="text-base font-normal text-muted-foreground"> per night</span>
              </p>
              <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                Capacity: {room.capacity} guest{room.capacity > 1 ? "s" : ""}
              </div>

              <div className="mt-8 rounded-3xl border bg-card p-6 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-gold">
                  Overview
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">{room.longDescription}</p>
              </div>

              <h2 className="mt-10 font-serif text-xl font-semibold">Amenities Included</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {room.amenities.map((a) => (
                  <div
                    key={a}
                    className="public-card-hover flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 text-sm shadow-sm"
                  >
                    <Sparkles className="h-4 w-4 text-brand-gold" />
                    {a}
                  </div>
                ))}
              </div>

              <h2 className="mt-10 font-serif text-xl font-semibold">Bed Preference</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {room.bedPreferences.map((preference) => (
                  <div
                    key={preference}
                    className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm shadow-sm"
                  >
                    {getBedPreferenceLabel(preference as PublicBedPreferenceId)}
                  </div>
                ))}
              </div>

              <h2 className="mt-10 font-serif text-xl font-semibold">Why You&apos;ll Love It</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {whyYoullLoveIt.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-start gap-3 rounded-2xl border bg-card px-4 py-3 text-sm shadow-sm">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <Clock className="h-5 w-5 text-brand-gold" />
                  <h3 className="mt-2 font-semibold">Check-In / Check-Out</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Check-in from {hotelPolicies.checkInTime}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Check-out by {hotelPolicies.checkOutTime}
                  </p>
                </div>
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <Shield className="h-5 w-5 text-brand-gold" />
                  <h3 className="mt-2 font-semibold">Cancellation Policy</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {hotelPolicies.cancellation}
                  </p>
                </div>
              </div>

              <h2 className="mt-10 font-serif text-xl font-semibold">House Rules</h2>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {hotelPolicies.roomRules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-3xl border bg-card p-6 shadow-lg">
                <h2 className="font-serif text-lg font-semibold">Reserve This Room</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Best rate when you book direct.
                </p>
                <div className="mt-4">
                  <BookingWidget catalogRooms={catalogRooms} defaultRoomSlug={room.slug} compact />
                </div>
                <div className="mt-4">
                  <PublicBookButton
                    href={`/book?room=${room.slug}`}
                    label={bookLabels.reserve}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <ScrollReveal className="mt-20">
            <h2 className="font-serif text-2xl font-bold">Related Rooms</h2>
            <p className="mt-2 text-muted-foreground">You may also enjoy these accommodations.</p>
            <div className="mt-8">
              <RelatedRoomsCarousel rooms={related} />
            </div>
          </ScrollReveal>
        )}

        <div className="mt-16 border-t pt-12">
          <PublicPageCTAs primaryLabel={bookLabels.reserve} primaryHref={`/book?room=${room.slug}`} />
        </div>
      </div>

      {lightboxOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
          aria-label="Close image preview"
        >
          <div className="relative max-h-[88vh] max-w-5xl overflow-hidden rounded-2xl">
            <Image
              src={room.images[activeImage]}
              alt={room.name}
              width={1400}
              height={1000}
              className="max-h-[88vh] w-auto object-contain"
            />
          </div>
        </button>
      ) : null}
    </section>
  );
}
