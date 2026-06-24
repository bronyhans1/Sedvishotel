"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { GalleryLightbox } from "@/components/public/GalleryLightbox";
import { galleryCategories, publicGalleryItems } from "@/lib/public/gallery-images";
import type { GalleryCategory } from "@/types/public";
import { cn } from "@/lib/utils";

export function GalleryGrid() {
  const [category, setCategory] = useState<GalleryCategory>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      category === "all"
        ? publicGalleryItems
        : publicGalleryItems.filter((i) => i.category === category),
    [category]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Browse our collection</p>
        <div className="flex flex-wrap justify-center gap-2">
          {galleryCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                category === cat.id
                  ? "bg-brand-navy text-white shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {filtered.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightboxIndex(idx)}
            className={cn(
              "mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border bg-card/30 text-left shadow-sm transition-transform duration-500 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand-gold",
              item.aspect === "tall" && "sm:row-span-2"
            )}
          >
            <div className="group relative">
              <Image
                src={item.image}
                alt={item.title}
                width={800}
                height={item.aspect === "tall" ? 1000 : 600}
                className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-brand-navy/80 via-brand-navy/10 to-transparent p-4 opacity-100 transition-opacity">
                <div>
                  <span className="text-xs font-medium uppercase tracking-[0.24em] text-brand-gold/90">
                    {galleryCategories.find((c) => c.id === item.category)?.label}
                  </span>
                  <p className="mt-1 text-sm font-medium text-white">{item.title}</p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <GalleryLightbox
        items={filtered}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
