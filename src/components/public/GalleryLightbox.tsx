"use client";

import Image from "next/image";
import { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { galleryCategories } from "@/lib/public/gallery-images";
import type { GalleryItem } from "@/types/public";

type Props = {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function GalleryLightbox({ items, index, onClose, onNavigate }: Props) {
  const go = useCallback(
    (dir: -1 | 1) => {
      if (index === null) return;
      const next = (index + dir + items.length) % items.length;
      onNavigate(next);
    },
    [index, items.length, onNavigate]
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [index, onClose, go]);

  if (index === null) return null;

  const item = items[index];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal
      aria-label="Image lightbox"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => go(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <div className="relative max-h-[85vh] max-w-5xl">
        <Image
          src={item.image}
          alt={item.title}
          width={1200}
          height={800}
          className="max-h-[85vh] w-auto rounded-lg object-contain"
        />
        <div className="mt-4 text-center text-white">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-brand-gold/90">
            {galleryCategories.find((category) => category.id === item.category)?.label ?? item.category}
          </p>
          <p className="mt-1">
            {item.title} · {index + 1} / {items.length}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => go(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
        aria-label="Next image"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
