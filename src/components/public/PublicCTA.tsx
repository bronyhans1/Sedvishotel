import Link from "next/link";

import { ScrollReveal } from "@/components/public/ScrollReveal";
import { PublicBookButton } from "@/components/public/PublicBookButton";
import { Button } from "@/components/ui/button";
import { publicImages } from "@/lib/public/images";

export function PublicCTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${publicImages.backgrounds.cta})`,
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-brand-navy/85" />
      <ScrollReveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
          Ready For Your Next Stay?
        </h2>
        <p className="mt-4 text-lg text-white/80">Book Your Room Today.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <PublicBookButton size="lg" showIcon />
          <Button
            size="lg"
            variant="outline"
            asChild
            className="border-white/40 bg-transparent text-white hover:bg-white/15 public-btn-lift"
          >
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </ScrollReveal>
    </section>
  );
}
