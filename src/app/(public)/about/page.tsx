import Image from "next/image";
import type { Metadata } from "next";
import { BedDouble, HeartHandshake, MapPin, ShieldCheck, Sparkles, Target } from "lucide-react";

import { PublicBookButton, bookLabels } from "@/components/public/PublicBookButton";
import { PublicPageCTAs } from "@/components/public/PublicPageCTAs";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { publicMetadata, publicSiteConfig } from "@/config/public-site";
import { publicImages } from "@/lib/public/images";
import { buildPublicMetadata } from "@/lib/public-seo";

export const metadata: Metadata = buildPublicMetadata({
  title: publicMetadata.about,
  description:
    "Learn about SEDVIS HOTEL — a peaceful and elegant hospitality destination in Ho, Volta Region, Ghana.",
  path: "/about",
});

const whyGuestsChooseUs = [
  "Comfortable Rooms",
  "Personalized Service",
  "Peaceful Environment",
  "Secure Parking",
  "Convenient Location",
  "24/7 Reception",
];

const values = [
  "Hospitality",
  "Cleanliness",
  "Comfort",
  "Integrity",
];

export default function AboutPage() {
  return (
    <>
      <PublicPageHeader
        eyebrow="About SEDVIS"
        title="About Us"
        subtitle="A peaceful and elegant hospitality destination in Ho, Volta Region."
      />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="mb-10 flex justify-center">
            <PublicBookButton label={bookLabels.experience} size="lg" />
          </ScrollReveal>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <ScrollReveal>
              <div className="relative overflow-hidden rounded-3xl border shadow-sm">
                <Image
                  src={publicImages.about.hero}
                  alt={`${publicSiteConfig.name} hospitality`}
                  width={1200}
                  height={900}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal className="space-y-8">
              <div className="rounded-3xl border bg-card p-8 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-gold">
                  Our Story
                </p>
                <h2 className="mt-3 font-serif text-3xl font-bold">Warm hospitality, thoughtfully offered.</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {publicSiteConfig.name} welcomes guests seeking comfort, calm, and attentive
                  service in Ho. We focus on clean, comfortable accommodations and a restful
                  atmosphere that makes every stay feel easy and personal.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Whether you are visiting for business, family time, or a quiet getaway, our
                  team is here to make your experience smooth, honest, and memorable.
                </p>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal className="mt-14">
            <div className="rounded-3xl border bg-muted/30 p-8 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-gold">
                Why Guests Choose Us
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {whyGuestsChooseUs.map((item) => (
                  <div key={item} className="public-card-hover rounded-2xl border bg-card px-5 py-4">
                    <div className="flex items-center gap-3">
                      <HeartHandshake className="h-5 w-5 text-brand-gold" />
                      <span className="font-medium">{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <ScrollReveal>
              <div className="public-card-hover rounded-3xl border bg-card p-8 shadow-sm">
                <Target className="h-8 w-8 text-brand-gold" />
                <h2 className="mt-4 font-serif text-2xl font-bold">Mission</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Deliver comfort and memorable experiences for every guest who stays with us.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="public-card-hover rounded-3xl border bg-card p-8 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-gold">
                  Values
                </p>
                <ul className="mt-5 space-y-3">
                  {values.map((value) => (
                    <li key={value} className="flex items-center gap-3 text-muted-foreground">
                      <Sparkles className="h-4 w-4 shrink-0 text-brand-gold" />
                      {value}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal className="mt-14">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <BedDouble className="h-6 w-6 text-brand-gold" />
                <h3 className="mt-3 font-semibold">Comfortable Rooms</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Designed for peaceful nights and a relaxing stay.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <ShieldCheck className="h-6 w-6 text-brand-gold" />
                <h3 className="mt-3 font-semibold">Secure Parking</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Convenient on-site parking for guests arriving by car.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <MapPin className="h-6 w-6 text-brand-gold" />
                <h3 className="mt-3 font-semibold">Convenient Location</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Well positioned in Ho for business, family visits, and local exploration.
                </p>
              </div>
            </div>
          </ScrollReveal>
          <div className="mt-16 border-t pt-12">
            <PublicPageCTAs primaryLabel={bookLabels.experience} />
          </div>
        </div>
      </section>
    </>
  );
}
