"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { PublicPageCTAs } from "@/components/public/PublicPageCTAs";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { PublicRoomCard } from "@/components/public/PublicRoomCard";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { Input } from "@/components/ui/input";
import { publicRooms } from "@/lib/mock-data/public-rooms";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto";

export function RoomsPageContent() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [priceMax, setPriceMax] = useState("all");
  const [capacity, setCapacity] = useState("all");

  const filtered = useMemo(() => {
    return publicRooms.filter((room) => {
      const q = search.trim().toLowerCase();
      if (q && !room.name.toLowerCase().includes(q) && !room.description.toLowerCase().includes(q)) {
        return false;
      }
      if (type !== "all" && room.categoryId !== type) return false;
      if (priceMax !== "all" && room.pricePerNight > Number(priceMax)) return false;
      if (capacity !== "all" && room.capacity < Number(capacity)) return false;
      return true;
    });
  }, [search, type, priceMax, capacity]);

  return (
    <>
      <PublicPageHeader
        eyebrow="Our Accommodations"
        title="Our Rooms"
        subtitle="Thoughtfully designed accommodations for every stay."
      />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className={selectClass}
              value={type}
              onChange={(e) => setType(e.target.value)}
              aria-label="Accommodation type"
            >
              <option value="all">All Accommodations</option>
              {publicRooms.map((r) => (
                <option key={r.categoryId} value={r.categoryId}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              aria-label="Price range"
            >
              <option value="all">Any Price</option>
              <option value="300">Up to GH₵300</option>
              <option value="500">Up to GH₵500</option>
              <option value="700">Up to GH₵700</option>
              <option value="1000">Up to GH₵1,000</option>
            </select>
            <select
              className={selectClass}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              aria-label="Capacity"
            >
              <option value="all">Any Capacity</option>
              <option value="1">1+ guests</option>
              <option value="2">2+ guests</option>
              <option value="4">4+ guests</option>
            </select>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {filtered.length} accommodation{filtered.length === 1 ? "" : "s"} available
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((room) => (
              <PublicRoomCard key={room.id} room={room} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">
              No rooms match your filters. Try adjusting your search.
            </p>
          )}
          <ScrollReveal className="mt-16 border-t pt-12">
            <PublicPageCTAs />
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
