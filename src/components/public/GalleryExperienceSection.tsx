"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ScrollReveal } from "@/components/public/ScrollReveal";
import { Button } from "@/components/ui/button";
import { publicSiteConfig } from "@/config/public-site";
import { getPublicHomeGalleryImages } from "@/lib/public/images";
import { cn } from "@/lib/utils";

const galleryImages = getPublicHomeGalleryImages();

export function GalleryExperienceSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-brand-navy py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-brand-gold">
                Gallery Experience
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
                Experience {publicSiteConfig.name}
              </h2>
              <p className="mt-4 max-w-xl text-white/75">
                Discover refined interiors, welcoming spaces, and the calm elegance that
                defines every stay with us.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-brand-gold/40 bg-transparent text-brand-gold hover:bg-brand-gold/10 public-btn-lift"
            >
              <Link href="/gallery">Explore Gallery</Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-12 lg:gap-5">
            <button
              type="button"
              className="group relative col-span-12 min-h-[280px] overflow-hidden rounded-2xl lg:col-span-7 lg:min-h-[480px]"
              onClick={() => setActive(0)}
              aria-label="View featured gallery image"
            >
              <Image
                src={galleryImages[active]}
                alt={`${publicSiteConfig.name} gallery`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-transparent to-transparent opacity-80" />
              <p className="absolute bottom-5 left-5 text-sm font-medium uppercase tracking-widest text-brand-gold">
                Featured
              </p>
            </button>

            <div className="col-span-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-2">
              {galleryImages.slice(1).map((src, index) => {
                const imageIndex = index + 1;
                return (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActive(imageIndex)}
                    className={cn(
                      "group relative aspect-[4/3] overflow-hidden rounded-xl transition-all duration-300",
                      active === imageIndex && "ring-2 ring-brand-gold ring-offset-2 ring-offset-brand-navy"
                    )}
                    aria-label={`View gallery image ${imageIndex + 1}`}
                  >
                    <Image
                      src={src}
                      alt={`${publicSiteConfig.name} property`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 50vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-brand-navy/0 transition-colors group-hover:bg-brand-navy/20" />
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
