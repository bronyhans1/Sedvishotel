"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";

import { PublicPageCTAs } from "@/components/public/PublicPageCTAs";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { BookingWidget } from "@/components/public/BookingWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hotelContact } from "@/config/hotel-contact";
import { BOOKING_STORAGE_KEY, calculateBookingPricing, checkPublicAvailability, createMockBooking } from "@/lib/public-booking";
import { getPublicRoomBySlug } from "@/lib/mock-data/public-rooms";
import {
  getBedPreferenceOptions,
  type PublicBedPreferenceId,
  type PublicRoomCategoryId,
} from "@/lib/public/room-categories";
import { formatCurrency } from "@/lib/utils";
import type { BookingGuest, BookingSearch, PublicRoom } from "@/types/public";

type Step = "search" | "results" | "review";

export function BookPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [search, setSearch] = useState<BookingSearch | null>(null);
  const [available, setAvailable] = useState<PublicRoom[]>([]);
  const [selected, setSelected] = useState<PublicRoom | null>(null);
  const [guest, setGuest] = useState<BookingGuest>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [bedPreference, setBedPreference] = useState<PublicBedPreferenceId>("none");

  useEffect(() => {
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    if (checkIn && checkOut) {
      const roomSlug = searchParams.get("room") ?? undefined;
      const s: BookingSearch = {
        checkIn,
        checkOut,
        adults: Number(searchParams.get("adults") ?? 2),
        children: Number(searchParams.get("children") ?? 0),
        roomTypeId: roomSlug
          ? getPublicRoomBySlug(roomSlug)?.id
          : undefined,
        specialRequests: searchParams.get("requests") ?? undefined,
      };
      setSearch(s);
      const rooms = checkPublicAvailability(s);
      setAvailable(rooms);
      setStep("results");
      const preselect = roomSlug ? getPublicRoomBySlug(roomSlug) : null;
      if (preselect && rooms.some((r) => r.slug === preselect.slug)) {
        setSelected(preselect);
        setBedPreference("none");
      }
    }
  }, [searchParams]);

  const pricing = useMemo(() => {
    if (!selected || !search) return null;
    return calculateBookingPricing(selected, search.checkIn, search.checkOut);
  }, [selected, search]);

  const bedOptions = useMemo(() => {
    if (!selected) return [];
    return getBedPreferenceOptions(selected.categoryId as PublicRoomCategoryId);
  }, [selected]);

  function confirmBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!search || !selected) return;
    const confirmation = createMockBooking(search, selected, guest, bedPreference);
    sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(confirmation));
    router.push("/booking/confirmation");
  }

  return (
    <>
      <PublicPageHeader
        eyebrow="Book Your Stay"
        title="Book Your Stay"
        subtitle="Your comfort starts here."
      />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 rounded-3xl border bg-card/70 p-5 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-gold">
              Reservation Journey
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Guest Details", active: step === "review" },
                { label: "Stay Details", active: step === "search" || step === "results" || step === "review" },
                { label: "Room Selection", active: step === "results" || step === "review" },
                { label: "Preferences", active: step === "review" },
                { label: "Review", active: step === "review" },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${
                    item.active ? "bg-brand-navy text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gold/20 text-xs font-bold text-brand-gold">
                    {i + 1}
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {step === "search" && (
            <div className="mx-auto max-w-xl">
              <BookingWidget
                defaultRoomSlug={searchParams.get("room") ?? undefined}
              />
            </div>
          )}

          {step === "results" && search && (
            <div className="space-y-8">
              <Button variant="ghost" size="sm" onClick={() => setStep("search")}>
                <ArrowLeft className="h-4 w-4" />
                Modify search
              </Button>
              <p className="text-muted-foreground">
                {available.length} accommodation{available.length !== 1 ? "s" : ""} available for{" "}
                {search.checkIn} → {search.checkOut}
              </p>
              <div className="grid gap-6 lg:grid-cols-2">
                {available.map((room) => {
                  const p = calculateBookingPricing(room, search.checkIn, search.checkOut);
                  const isSelected = selected?.slug === room.slug;
                  return (
                    <div
                      key={room.slug}
                      className={`overflow-hidden rounded-3xl border bg-card shadow-sm transition-all ${
                        isSelected ? "border-brand-gold ring-2 ring-brand-gold/30 shadow-lg" : ""
                      }`}
                    >
                      <div className="relative aspect-video">
                        <Image src={room.images[0]} alt={room.name} fill className="object-cover" />
                      </div>
                      <div className="p-6">
                        <h3 className="font-serif text-xl font-semibold">{room.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {room.capacity} guests · {p.nights} night{p.nights > 1 ? "s" : ""}
                        </p>
                        <p className="mt-2 text-lg font-bold text-brand-navy">
                          {formatCurrency(p.total)} total
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-1">
                          {room.amenities.slice(0, 3).map((a) => (
                            <li key={a} className="text-xs text-muted-foreground">
                              {a}
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="mt-4 w-full"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => {
                            setSelected(room);
                            setBedPreference("none");
                            setStep("review");
                          }}
                        >
                          {isSelected ? "Selected" : "Book Now"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === "review" && search && selected && pricing && (
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <Button variant="ghost" size="sm" className="mb-4" onClick={() => setStep("results")}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to rooms
                </Button>
                <h2 className="font-serif text-2xl font-bold">Guest Details</h2>
                <p className="mt-2 text-sm text-muted-foreground">Almost done. Tell us how to prepare for your stay.</p>
                <form className="mt-6 space-y-4" onSubmit={confirmBooking}>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={guest.fullName}
                      onChange={(e) => setGuest((g) => ({ ...g, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={guest.email}
                      onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={guest.phone}
                      onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))}
                      required
                    />
                  </div>
                  {bedOptions.length > 0 && (
                    <fieldset className="space-y-3 rounded-2xl border bg-muted/30 p-4">
                      <legend className="text-sm font-medium">Bed Preference</legend>
                      <div className="space-y-2">
                        {bedOptions.map((option) => (
                          <label
                            key={option.id}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors has-[:checked]:border-brand-gold has-[:checked]:bg-brand-gold/5"
                          >
                            <input
                              type="radio"
                              name="bedPreference"
                              value={option.id}
                              checked={bedPreference === option.id}
                              onChange={() => setBedPreference(option.id)}
                              className="h-4 w-4 accent-brand-gold"
                              required
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  <Button type="submit" size="lg" className="w-full bg-brand-gold text-brand-navy">
                    <Check className="h-4 w-4" />
                    Confirm Reservation
                  </Button>
                </form>
              </div>
              <div className="rounded-3xl border bg-muted/30 p-6 shadow-sm lg:sticky lg:top-28 lg:self-start">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-gold">
                  Review Your Reservation
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold">Stay Summary</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Room</dt>
                    <dd className="font-medium">{selected.name}</dd>
                  </div>
                  {bedPreference && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Bed Preference</dt>
                      <dd>
                        {bedOptions.find((o) => o.id === bedPreference)?.label ?? bedPreference}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Check-in</dt>
                    <dd>{search.checkIn}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Check-out</dt>
                    <dd>{search.checkOut}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Guests</dt>
                    <dd>
                      {search.adults} adult{search.adults > 1 ? "s" : ""}
                      {search.children > 0 ? `, ${search.children} child` : ""}
                    </dd>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <dt className="text-muted-foreground">Subtotal ({pricing.nights} nights)</dt>
                    <dd>{formatCurrency(pricing.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Taxes (15%)</dt>
                    <dd>{formatCurrency(pricing.taxes)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Service charge (5%)</dt>
                    <dd>{formatCurrency(pricing.service)}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-base font-bold">
                    <dt>Total</dt>
                    <dd className="text-brand-navy">{formatCurrency(pricing.total)}</dd>
                  </div>
                </dl>
                <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
                  Need assistance? Call{" "}
                  <a href={`tel:${hotelContact.phoneTel}`} className="font-medium text-brand-navy hover:text-brand-gold">
                    {hotelContact.phoneDisplay}
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-16 border-t pt-12">
          <PublicPageCTAs />
        </div>
      </section>
    </>
  );
}
