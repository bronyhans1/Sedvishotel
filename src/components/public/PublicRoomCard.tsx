import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";

import { PublicBookButton, bookLabels } from "@/components/public/PublicBookButton";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { PublicRoom } from "@/types/public";

type Props = {
  room: PublicRoom;
  compact?: boolean;
};

export function PublicRoomCard({ room, compact }: Props) {
  return (
    <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={room.images[0]}
          alt={room.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute right-3 top-3 rounded-full bg-brand-navy/90 px-3 py-1 text-sm font-semibold text-brand-gold">
          {formatCurrency(room.pricePerNight)}
          <span className="text-xs font-normal text-white/80"> / night</span>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="font-serif text-xl font-semibold">{room.name}</h3>
        {!compact && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {room.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          Up to {room.capacity} guest{room.capacity > 1 ? "s" : ""}
        </div>
        {!compact && (
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
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
            <Link href={`/rooms/${room.slug}`}>View Details</Link>
          </Button>
            <PublicBookButton
              href={`/book?room=${room.slug}`}
              label={bookLabels.bookRoom}
              variant="secondary"
              size="sm"
              className="flex-1 sm:flex-none"
            />
        </div>
      </div>
    </article>
  );
}
