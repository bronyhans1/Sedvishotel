import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";

import { LuxuryButton } from "@/components/public/LuxuryButton";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { PublicRoom } from "@/types/public";

type Props = {
  room: PublicRoom;
  /** Prefer a different gallery frame without duplicating the same photo. */
  imageSrc?: string;
  /** Center “hero” card — Deluxe featured treatment. */
  highlight?: boolean;
  compact?: boolean;
};

export function FeaturedRoomCard({
  room,
  imageSrc,
  highlight = false,
  compact,
}: Props) {
  const src = imageSrc ?? room.images[0];

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card transition-all duration-500 ease-out",
        highlight
          ? "z-[1] border-brand-gold/35 shadow-[0_22px_50px_-24px_rgba(12,24,45,0.45)] sm:-translate-y-2 sm:scale-[1.04]"
          : "shadow-sm hover:-translate-y-1.5 hover:shadow-[0_18px_40px_-20px_rgba(12,24,45,0.35)]",
        highlight && "hover:-translate-y-3 hover:shadow-[0_28px_56px_-22px_rgba(12,24,45,0.5)]"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          highlight ? "aspect-[4/3.15] sm:aspect-[4/3.4]" : "aspect-[4/3]"
        )}
      >
        <Image
          src={src}
          alt={room.name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-brand-navy/15 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
        {highlight ? (
          <div className="absolute left-3 top-3 rounded-full border border-brand-gold/50 bg-brand-navy/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-brand-gold backdrop-blur-sm">
            ★ Featured Deluxe ★
          </div>
        ) : null}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <h3
            className={cn(
              "font-serif font-semibold text-white public-hero-text-shadow",
              highlight ? "text-2xl sm:text-[1.65rem]" : "text-xl"
            )}
          >
            {room.name}
          </h3>
          <div className="shrink-0 rounded-full bg-brand-navy/90 px-3 py-1 text-sm font-semibold text-brand-gold backdrop-blur-sm">
            {formatCurrency(room.pricePerNight)}
            <span className="text-xs font-normal text-white/80"> / night</span>
          </div>
        </div>
      </div>

      <div className={cn("p-5 sm:p-6", highlight && "sm:p-7")}>
        {!compact ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {room.description}
          </p>
        ) : null}
        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          Up to {room.capacity} guest{room.capacity > 1 ? "s" : ""}
        </div>
        {!compact ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {room.amenities.slice(0, 4).map((a) => (
              <li
                key={a}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {a}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="public-btn-lift flex-1 border-brand-navy/20 sm:flex-none"
          >
            <Link href={`/rooms/${room.slug}`}>View Details</Link>
          </Button>
          <LuxuryButton
            href={`/book?room=${room.slug}`}
            label="Book This Room"
            variant="secondary"
            size="sm"
            className="flex-1 sm:flex-none"
          />
        </div>
      </div>
    </article>
  );
}
