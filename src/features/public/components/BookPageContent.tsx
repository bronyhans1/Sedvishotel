"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, Check } from "lucide-react";

import { BookingSummaryCard } from "@/components/public/BookingSummaryCard";
import { PublicPageCTAs } from "@/components/public/PublicPageCTAs";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { BookingWidget } from "@/components/public/BookingWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkPublicAvailabilityAction,
  submitWebsiteReservationAction,
} from "@/features/public/actions";
import { BOOKING_STORAGE_KEY, calculateBookingPricing } from "@/lib/public-booking";
import { validateMinimumStay } from "@/lib/public/booking-validation";
import { getPublicRoomBySlug } from "@/lib/public/public-room-catalog";
import {
  getBedPreferenceOptions,
  type PublicBedPreferenceId,
  type PublicRoomCategoryId,
} from "@/lib/public/room-categories";
import { formatCurrency } from "@/lib/utils";
import type { BookingGuest, BookingSearch, PublicBookingPricingSettings, PublicRoom } from "@/types/public";

type Step = "search" | "results" | "review";

type BookPageContentProps = {
  pricingSettings: PublicBookingPricingSettings;
  catalogRooms: PublicRoom[];
};

export function BookPageContent({ pricingSettings, catalogRooms }: BookPageContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [search, setSearch] = useState<BookingSearch | null>(null);
  const [available, setAvailable] = useState<PublicRoom[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [selected, setSelected] = useState<PublicRoom | null>(null);
  const [guest, setGuest] = useState<BookingGuest>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [bedPreference, setBedPreference] = useState<PublicBedPreferenceId>("none");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, startSubmit] = useTransition();
  const [loadingAvailability, startAvailabilityLoad] = useTransition();

  useEffect(() => {
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    if (!checkIn || !checkOut) return;

    const dateError = validateMinimumStay(checkIn, checkOut);
    if (dateError) {
      setSearch(null);
      setAvailable([]);
      setAvailabilityMessage(dateError);
      setStep("search");
      return;
    }

    const roomSlug = searchParams.get("room") ?? undefined;
    const s: BookingSearch = {
      checkIn,
      checkOut,
      adults: Number(searchParams.get("adults") ?? 2),
      children: Number(searchParams.get("children") ?? 0),
      roomTypeId: roomSlug
        ? getPublicRoomBySlug(catalogRooms, roomSlug)?.id
        : undefined,
      specialRequests: searchParams.get("requests") ?? undefined,
    };
    setSearch(s);
    setAvailabilityMessage("");

    startAvailabilityLoad(async () => {
      const result = await checkPublicAvailabilityAction(s);
      if (!result.success) {
        setAvailable([]);
        setAvailabilityMessage(result.error);
        setStep("results");
        return;
      }

      setAvailable(result.rooms);
      setAvailabilityMessage("");
      setStep("results");

      const preselect = roomSlug
        ? getPublicRoomBySlug(catalogRooms, roomSlug)
        : null;
      if (preselect && result.rooms.some((r) => r.slug === preselect.slug)) {
        setSelected(preselect);
        setBedPreference("none");
      }
    });
  }, [searchParams, catalogRooms]);

  const bedOptions = useMemo(() => {
    if (!selected) return [];
    return getBedPreferenceOptions(selected.categoryId as PublicRoomCategoryId);
  }, [selected]);

  function confirmBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!search || !selected) return;
    setSubmitError("");

    startSubmit(async () => {
      const result = await submitWebsiteReservationAction({
        search,
        roomTypeSlug: selected.slug,
        guest,
        bedPreference,
      });

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      sessionStorage.setItem(
        BOOKING_STORAGE_KEY,
        JSON.stringify(result.confirmation)
      );
      router.push("/booking/confirmation");
    });
  }

  const resultsMessage = loadingAvailability
    ? "Checking live availability…"
    : availabilityMessage ||
      (available.length === 0
        ? "No rooms are available for the selected dates."
        : `${available.length} accommodation${available.length !== 1 ? "s" : ""} available for ${search?.checkIn} → ${search?.checkOut}`);

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
              {availabilityMessage ? (
                <p className="mb-4 text-sm text-destructive">{availabilityMessage}</p>
              ) : null}
              <BookingWidget
                catalogRooms={catalogRooms}
                defaultRoomSlug={searchParams.get("room") ?? undefined}
              />
            </div>
          )}

          {step === "results" && search && (
            <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-start">
              <div className="space-y-8">
                <Button variant="ghost" size="sm" onClick={() => setStep("search")}>
                  <ArrowLeft className="h-4 w-4" />
                  Modify search
                </Button>
                <p className="text-muted-foreground">{resultsMessage}</p>
                <div className="grid gap-6 lg:grid-cols-2">
                  {available.map((room) => {
                    const p = calculateBookingPricing(
                      room,
                      search.checkIn,
                      search.checkOut,
                      pricingSettings
                    );
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

              {selected ? (
                <BookingSummaryCard
                  room={selected}
                  search={search}
                  pricingSettings={pricingSettings}
                  className="lg:sticky lg:top-28"
                />
              ) : null}
            </div>
          )}

          {step === "review" && search && selected && (
            <div className="grid gap-10 lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-start">
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
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      value={guest.phone}
                      onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address (optional)</Label>
                    <Input
                      type="email"
                      value={guest.email ?? ""}
                      onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
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
                  <Button type="submit" size="lg" className="w-full bg-brand-gold text-brand-navy" disabled={isSubmitting}>
                    <Check className="h-4 w-4" />
                    {isSubmitting ? "Submitting…" : "Submit Reservation Request"}
                  </Button>
                  {submitError ? (
                    <p className="text-sm text-destructive">{submitError}</p>
                  ) : null}
                </form>
              </div>

              <BookingSummaryCard
                room={selected}
                search={search}
                pricingSettings={pricingSettings}
                className="lg:sticky lg:top-28"
              />
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
