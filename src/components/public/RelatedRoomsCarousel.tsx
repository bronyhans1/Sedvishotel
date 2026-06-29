"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PublicRoomCard } from "@/components/public/PublicRoomCard";
import type { PublicRoom } from "@/types/public";

type Props = {
  rooms: PublicRoom[];
};

export function RelatedRoomsCarousel({ rooms }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory scrollbar-thin"
      >
        {rooms.map((room) => (
          <div key={room.id} className="w-[min(100%,320px)] shrink-0 snap-start">
            <PublicRoomCard room={room} compact />
          </div>
        ))}
      </div>
      {rooms.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute -left-2 top-1/2 hidden -translate-y-1/2 rounded-full border bg-card p-2 shadow-md sm:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute -right-2 top-1/2 hidden -translate-y-1/2 rounded-full border bg-card p-2 shadow-md sm:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
