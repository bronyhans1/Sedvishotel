import type { Metadata } from "next";

import { GalleryGrid } from "@/components/public/GalleryGrid";
import { PublicBookButton, bookLabels } from "@/components/public/PublicBookButton";
import { PublicPageCTAs } from "@/components/public/PublicPageCTAs";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { publicMetadata } from "@/config/public-site";
import { buildPublicMetadata } from "@/lib/public-seo";

export const metadata: Metadata = buildPublicMetadata({
  title: publicMetadata.gallery,
  description:
    "Explore SEDVIS HOTEL through room interiors and corridor views from our growing photo collection.",
  path: "/gallery",
});

export default function GalleryPage() {
  return (
    <>
      <PublicPageHeader
        eyebrow="Gallery Experience"
        title="Gallery"
        subtitle="Browse our collection of room interiors and corridor views at SEDVIS HOTEL."
        background="galleryHeader"
      />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="mb-10 flex justify-center">
            <PublicBookButton label={bookLabels.plan} size="lg" />
          </ScrollReveal>
          <GalleryGrid />
          <div className="mt-16 border-t pt-12">
            <PublicPageCTAs primaryLabel={bookLabels.plan} />
          </div>
        </div>
      </section>
    </>
  );
}
