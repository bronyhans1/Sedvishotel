"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  Wifi,
} from "lucide-react";

import {
  BookingJourneyProgress,
  type BookingJourneyStepId,
} from "@/components/public/BookingJourneyProgress";
import { BookingSummaryCard } from "@/components/public/BookingSummaryCard";
import { PublicPageCTAs } from "@/components/public/PublicPageCTAs";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { BookingWidget } from "@/components/public/BookingWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hotelContact } from "@/config/hotel-contact";
import { hotelPolicies } from "@/config/hotel-policies";
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
import { cn, formatCurrency } from "@/lib/utils";
import type {
  BookingGuest,
  BookingSearch,
  PublicBookingPricingSettings,
  PublicRoom,
} from "@/types/public";

type BookPageContentProps = {
  pricingSettings: PublicBookingPricingSettings;
  catalogRooms: PublicRoom[];
};

type BookingSurface = "landing" | "empty" | "journey";

const EXTRA_REQUEST_OPTIONS = [
  { id: "early-check-in", label: "Early Check-In Request" },
  { id: "late-check-out", label: "Late Check-Out Request" },
  { id: "airport-pickup", label: "Airport Pickup" },
  { id: "breakfast", label: "Breakfast" },
  { id: "celebration", label: "Celebration Setup" },
] as const;

function detectAcLabel(amenities: string[]): string | null {
  const joined = amenities.join(" ").toLowerCase();
  if (/\bnon[-\s]?ac\b|\bno air\b/.test(joined)) return "Non-AC";
  if (/\bac\b|air\s?cond/.test(joined)) return "AC";
  return null;
}

function hasBreakfast(amenities: string[]): boolean {
  return amenities.some((a) => /breakfast/i.test(a));
}

function hasWifi(amenities: string[]): boolean {
  return amenities.some((a) => /wi-?fi|wireless/i.test(a));
}

function detectRoomSize(amenities: string[], description: string): string | null {
  const haystack = `${amenities.join(" ")} ${description}`;
  const match = haystack.match(/(\d+)\s*(m²|sq\.?\s*m|sqm|square\s*meters?)/i);
  if (match) return `${match[1]} ${match[2].replace(/\s+/g, " ")}`;
  return null;
}

function buildSpecialRequests(
  base: string | undefined,
  selectedExtras: string[],
  additionalNotes: string
): string | undefined {
  const parts: string[] = [];
  if (base?.trim()) parts.push(base.trim());
  for (const id of selectedExtras) {
    const option = EXTRA_REQUEST_OPTIONS.find((o) => o.id === id);
    if (option) parts.push(option.label);
  }
  if (additionalNotes.trim()) parts.push(additionalNotes.trim());
  if (parts.length === 0) return undefined;
  return parts.join("; ");
}

function RoomCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-3xl border bg-card shadow-sm"
      aria-hidden
    >
      <div className="aspect-[16/10] animate-pulse bg-muted" />
      <div className="space-y-3 p-6">
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

export function BookPageContent({ pricingSettings, catalogRooms }: BookPageContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const guestHeadingRef = useRef<HTMLHeadingElement>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);

  const [surface, setSurface] = useState<BookingSurface>("landing");
  const [step, setStep] = useState<BookingJourneyStepId>("stay");
  const [search, setSearch] = useState<BookingSearch | null>(null);
  const [available, setAvailable] = useState<PublicRoom[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [selected, setSelected] = useState<PublicRoom | null>(null);
  const [roomSelectFlash, setRoomSelectFlash] = useState(false);
  const [guest, setGuest] = useState<BookingGuest>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [bedPreference, setBedPreference] = useState<PublicBedPreferenceId>("none");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [agreeCancellation, setAgreeCancellation] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [guestError, setGuestError] = useState("");
  const [isSubmitting, startSubmit] = useTransition();
  const [loadingAvailability, startAvailabilityLoad] = useTransition();

  useEffect(() => {
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    if (!checkIn || !checkOut) {
      setSurface("landing");
      setStep("stay");
      return;
    }

    const dateError = validateMinimumStay(checkIn, checkOut);
    if (dateError) {
      setSearch(null);
      setAvailable([]);
      setAvailabilityMessage(dateError);
      setSurface("landing");
      setStep("stay");
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
    setSelected(null);
    setAvailabilityMessage("");
    setSurface("journey");
    setStep("room");

    startAvailabilityLoad(async () => {
      const result = await checkPublicAvailabilityAction(s);
      if (!result.success || result.rooms.length === 0) {
        setAvailable([]);
        setAvailabilityMessage(
          result.success
            ? "No rooms are available for your selected dates."
            : result.error
        );
        setSurface("empty");
        return;
      }

      setAvailable(result.rooms);
      setAvailabilityMessage("");
      setSurface("journey");
      setStep("room");

      const preselect = roomSlug
        ? getPublicRoomBySlug(catalogRooms, roomSlug)
        : null;
      if (preselect && result.rooms.some((r) => r.slug === preselect.slug)) {
        setSelected(preselect);
        setBedPreference("none");
      }
    });
  }, [searchParams, catalogRooms]);

  useEffect(() => {
    if (step === "guest") {
      guestHeadingRef.current?.focus();
    }
    if (step === "review") {
      reviewHeadingRef.current?.focus();
    }
  }, [step]);

  const bedOptions = useMemo(() => {
    if (!selected) return [];
    return getBedPreferenceOptions(selected.categoryId as PublicRoomCategoryId);
  }, [selected]);

  const extrasSummary = useMemo(() => {
    const labels: string[] = [];
    const bedLabel = bedOptions.find((o) => o.id === bedPreference)?.label;
    if (bedLabel && bedPreference !== "none") labels.push(bedLabel);
    for (const id of selectedExtras) {
      const option = EXTRA_REQUEST_OPTIONS.find((o) => o.id === id);
      if (option) labels.push(option.label);
    }
    if (additionalNotes.trim()) labels.push("Additional notes");
    return labels;
  }, [bedOptions, bedPreference, selectedExtras, additionalNotes]);

  const reviewPricing = useMemo(() => {
    if (!selected || !search) return null;
    return calculateBookingPricing(
      selected,
      search.checkIn,
      search.checkOut,
      pricingSettings
    );
  }, [selected, search, pricingSettings]);

  function toggleExtra(id: string) {
    setSelectedExtras((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function backToSearch() {
    setSurface("landing");
    setStep("stay");
    setSearch(null);
    setAvailable([]);
    setSelected(null);
    setAvailabilityMessage("");
    setAgreeCancellation(false);
    setAgreePrivacy(false);
    router.push("/book");
  }

  function selectRoom(room: PublicRoom) {
    setSelected(room);
    setBedPreference("none");
    setRoomSelectFlash(true);
    window.setTimeout(() => {
      setRoomSelectFlash(false);
      setStep("guest");
    }, 700);
  }

  function continueFromGuest(e: React.FormEvent) {
    e.preventDefault();
    setGuestError("");
    if (!guest.fullName.trim() || !guest.phone.trim()) {
      setGuestError("Please enter your full name and phone number.");
      return;
    }
    setStep("extras");
  }

  function confirmBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!search || !selected) return;
    if (!agreeCancellation || !agreePrivacy) {
      setSubmitError("Please agree to the cancellation and privacy policies.");
      return;
    }
    setSubmitError("");

    const mergedRequests = buildSpecialRequests(
      search.specialRequests,
      selectedExtras,
      additionalNotes
    );
    const searchWithRequests: BookingSearch = {
      ...search,
      specialRequests: mergedRequests,
      bedPreference,
    };

    startSubmit(async () => {
      const result = await submitWebsiteReservationAction({
        search: searchWithRequests,
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
    : `${available.length} accommodation${available.length !== 1 ? "s" : ""} available for ${search?.checkIn} → ${search?.checkOut}`;

  const showSummary =
    Boolean(selected && search) &&
    surface === "journey" &&
    (step === "guest" || step === "extras" || step === "review" || roomSelectFlash);

  const canComplete = agreeCancellation && agreePrivacy && !isSubmitting;

  return (
    <>
      <PublicPageHeader
        eyebrow="Book Your Stay"
        title="Book Your Stay"
        subtitle="Your comfort starts here."
      />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {surface === "journey" ? (
            <div className="mb-10 public-animate-fade-up">
              <BookingJourneyProgress current={step} />
            </div>
          ) : null}

          {surface === "landing" && (
            <div className="mx-auto max-w-xl public-animate-fade-up">
              <div className="mb-8 text-center">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-gold">
                  Find Your Stay
                </p>
                <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight">
                  Check Availability
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Choose your dates and guests to see rooms available for your visit.
                </p>
              </div>
              {availabilityMessage ? (
                <p className="mb-4 text-sm text-destructive" role="alert">
                  {availabilityMessage}
                </p>
              ) : null}
              <div className="rounded-[1.75rem] border border-brand-gold/20 bg-card p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] sm:p-8">
                <BookingWidget
                  catalogRooms={catalogRooms}
                  defaultRoomSlug={searchParams.get("room") ?? undefined}
                />
              </div>
            </div>
          )}

          {surface === "empty" && (
            <div className="mx-auto max-w-lg public-animate-fade-up rounded-[1.75rem] border bg-card px-6 py-12 text-center shadow-sm sm:px-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <h2 className="mt-6 font-serif text-2xl font-bold">No Availability</h2>
              <p className="mt-3 text-muted-foreground">
                {availabilityMessage ||
                  "No rooms are available for your selected dates."}
              </p>
              {search ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {search.checkIn} → {search.checkOut}
                </p>
              ) : null}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button variant="outline" onClick={backToSearch}>
                  Modify Dates
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Contact Reception</Link>
                </Button>
                <Button
                  className="bg-brand-navy hover:bg-brand-navy/90"
                  onClick={backToSearch}
                >
                  Back to Search
                </Button>
              </div>
            </div>
          )}

          {surface === "journey" && step === "room" && search && (
            <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-start">
              <div className="space-y-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-3xl font-bold tracking-tight">
                      Choose Your Room
                    </h2>
                    <p className="mt-2 text-muted-foreground">{resultsMessage}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={backToSearch}>
                    <ArrowLeft className="h-4 w-4" />
                    Modify Dates
                  </Button>
                </div>

                {loadingAvailability ? (
                  <div
                    className="grid gap-6 lg:grid-cols-2"
                    aria-busy="true"
                    aria-label="Loading available rooms"
                  >
                    <RoomCardSkeleton />
                    <RoomCardSkeleton />
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {available.map((room) => {
                      const p = calculateBookingPricing(
                        room,
                        search.checkIn,
                        search.checkOut,
                        pricingSettings
                      );
                      const isSelected = selected?.slug === room.slug;
                      const acLabel = detectAcLabel(room.amenities);
                      const breakfast = hasBreakfast(room.amenities);
                      const wifi = hasWifi(room.amenities);
                      const roomSize = detectRoomSize(
                        room.amenities,
                        room.description || room.longDescription || ""
                      );

                      return (
                        <article
                          key={room.slug}
                          className={cn(
                            "group overflow-hidden rounded-[1.75rem] border bg-card shadow-sm transition-all duration-500",
                            isSelected
                              ? "border-brand-gold ring-2 ring-brand-gold/35 shadow-xl scale-[1.01]"
                              : "hover:border-brand-gold/40 hover:shadow-lg"
                          )}
                        >
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <Image
                              src={room.images[0]}
                              alt={room.name}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                              sizes="(max-width: 1024px) 100vw, 40vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
                              {acLabel ? (
                                <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-navy">
                                  {acLabel}
                                </span>
                              ) : null}
                              {breakfast ? (
                                <span className="rounded-full bg-brand-gold px-2.5 py-1 text-xs font-semibold text-brand-navy">
                                  Breakfast Included
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="space-y-4 p-6">
                            <div>
                              <h3 className="font-serif text-2xl font-semibold tracking-tight">
                                {room.name}
                              </h3>
                              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                {room.description ||
                                  "A comfortable stay thoughtfully prepared for your visit."}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" aria-hidden />
                                Up to {room.capacity} guests
                              </span>
                              {roomSize ? (
                                <>
                                  <span aria-hidden>·</span>
                                  <span>{roomSize}</span>
                                </>
                              ) : null}
                              {wifi ? (
                                <>
                                  <span aria-hidden>·</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Wifi className="h-3.5 w-3.5" aria-hidden />
                                    Free Wi-Fi
                                  </span>
                                </>
                              ) : null}
                            </div>

                            <p className="font-serif text-2xl font-bold text-brand-navy">
                              {formatCurrency(room.pricePerNight)}
                              <span className="ml-1 font-sans text-sm font-medium text-muted-foreground">
                                / night
                              </span>
                            </p>

                            <ul
                              className="flex flex-wrap gap-1.5"
                              aria-label="Popular amenities"
                            >
                              {room.amenities.slice(0, 5).map((amenity) => (
                                <li
                                  key={amenity}
                                  className="rounded-full bg-muted/80 px-2.5 py-1 text-xs text-muted-foreground"
                                >
                                  {amenity}
                                </li>
                              ))}
                            </ul>

                            <p className="text-xs leading-relaxed text-muted-foreground">
                              Estimated stay total {formatCurrency(p.total)} for{" "}
                              {p.nights} night{p.nights > 1 ? "s" : ""}.{" "}
                              {hotelPolicies.cancellation}
                            </p>

                            <Button
                              className="w-full bg-brand-gold text-brand-navy hover:bg-brand-gold/90"
                              size="lg"
                              onClick={() => selectRoom(room)}
                              disabled={roomSelectFlash}
                            >
                              {isSelected && roomSelectFlash ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Room Selected
                                </>
                              ) : (
                                "Select Room"
                              )}
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {roomSelectFlash && selected ? (
                  <div
                    className="public-animate-fade-up rounded-2xl border border-brand-gold/40 bg-brand-gold/10 px-5 py-4"
                    role="status"
                    aria-live="polite"
                  >
                    <p className="flex items-center gap-2 font-medium text-brand-navy">
                      <Check className="h-5 w-5 text-emerald-600" aria-hidden />
                      Room Selected — {selected.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Continuing to guest details…
                    </p>
                  </div>
                ) : null}
              </div>

              {showSummary && selected ? (
                <BookingSummaryCard
                  room={selected}
                  search={search}
                  pricingSettings={pricingSettings}
                  compact
                  className="lg:sticky lg:top-28"
                />
              ) : null}
            </div>
          )}

          {surface === "journey" && step === "guest" && search && selected && (
            <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-start">
              <div className="public-animate-fade-up rounded-[1.75rem] border bg-card p-6 shadow-sm sm:p-8">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-4"
                  onClick={() => setStep("room")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to rooms
                </Button>
                <h2
                  ref={guestHeadingRef}
                  tabIndex={-1}
                  className="font-serif text-3xl font-bold tracking-tight outline-none"
                >
                  Guest Details
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Tell us how to reach you about your reservation.
                </p>
                <form className="mt-8 space-y-5" onSubmit={continueFromGuest}>
                  <div className="space-y-2">
                    <Label htmlFor="guest-full-name">Full Name</Label>
                    <Input
                      id="guest-full-name"
                      value={guest.fullName}
                      onChange={(e) =>
                        setGuest((g) => ({ ...g, fullName: e.target.value }))
                      }
                      required
                      autoComplete="name"
                      className="min-h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guest-email">Email</Label>
                    <Input
                      id="guest-email"
                      type="email"
                      value={guest.email ?? ""}
                      onChange={(e) =>
                        setGuest((g) => ({ ...g, email: e.target.value }))
                      }
                      autoComplete="email"
                      className="min-h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guest-phone">Phone Number</Label>
                    <Input
                      id="guest-phone"
                      type="tel"
                      value={guest.phone}
                      onChange={(e) =>
                        setGuest((g) => ({ ...g, phone: e.target.value }))
                      }
                      required
                      autoComplete="tel"
                      className="min-h-11"
                    />
                  </div>
                  {guestError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {guestError}
                    </p>
                  ) : null}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-brand-navy hover:bg-brand-navy/90"
                  >
                    Continue to Extras
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </div>

              <BookingSummaryCard
                room={selected}
                search={search}
                pricingSettings={pricingSettings}
                guestName={guest.fullName}
                className="lg:sticky lg:top-28"
              />
            </div>
          )}

          {surface === "journey" && step === "extras" && search && selected && (
            <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-start">
              <div className="public-animate-fade-up rounded-[1.75rem] border bg-card p-6 shadow-sm sm:p-8">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-4"
                  onClick={() => setStep("guest")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to guest details
                </Button>
                <h2 className="font-serif text-3xl font-bold tracking-tight">Extras</h2>
                <p className="mt-2 text-muted-foreground">
                  Optional requests to help us prepare a more comfortable stay.
                </p>

                <div className="mt-8 space-y-6">
                  {bedOptions.length > 0 ? (
                    <fieldset className="space-y-3">
                      <legend className="text-sm font-medium">Bed Preference</legend>
                      <div className="space-y-2">
                        {bedOptions.map((option) => (
                          <label
                            key={option.id}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors has-[:checked]:border-brand-gold has-[:checked]:bg-brand-gold/5"
                          >
                            <input
                              type="radio"
                              name="bedPreference"
                              value={option.id}
                              checked={bedPreference === option.id}
                              onChange={() => setBedPreference(option.id)}
                              className="h-4 w-4 accent-brand-gold"
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  <fieldset className="space-y-3">
                    <legend className="text-sm font-medium">Special Requests</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {EXTRA_REQUEST_OPTIONS.map((option) => (
                        <label
                          key={option.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors has-[:checked]:border-brand-gold has-[:checked]:bg-brand-gold/5"
                        >
                          <input
                            type="checkbox"
                            checked={selectedExtras.includes(option.id)}
                            onChange={() => toggleExtra(option.id)}
                            className="h-4 w-4 accent-brand-gold"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="space-y-2">
                    <Label htmlFor="additional-notes">Additional Notes</Label>
                    <Textarea
                      id="additional-notes"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="Anything else we should know?"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Requests are subject to availability and will be confirmed by our
                      team.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="sm:flex-1"
                      onClick={() => setStep("review")}
                    >
                      Skip extras
                    </Button>
                    <Button
                      type="button"
                      className="bg-brand-navy hover:bg-brand-navy/90 sm:flex-1"
                      onClick={() => setStep("review")}
                    >
                      Continue to Review
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <BookingSummaryCard
                room={selected}
                search={search}
                pricingSettings={pricingSettings}
                guestName={guest.fullName}
                extrasSummary={extrasSummary}
                className="lg:sticky lg:top-28"
              />
            </div>
          )}

          {surface === "journey" &&
            step === "review" &&
            search &&
            selected &&
            reviewPricing && (
              <div className="grid gap-8 lg:grid-cols-[1.15fr_minmax(300px,380px)] lg:items-start">
                <div className="public-animate-fade-up space-y-6">
                  <div className="rounded-[1.75rem] border bg-card p-6 shadow-sm sm:p-8">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mb-4"
                      onClick={() => setStep("extras")}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to extras
                    </Button>
                    <h2
                      ref={reviewHeadingRef}
                      tabIndex={-1}
                      className="font-serif text-3xl font-bold tracking-tight outline-none"
                    >
                      Review & Confirm
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      Please review your reservation details before completing your
                      request.
                    </p>

                    <div className="mt-8 space-y-6 text-sm">
                      <section className="rounded-2xl border bg-muted/20 p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                          Guest Information
                        </h3>
                        <p className="mt-3 font-medium">{guest.fullName}</p>
                        <p className="text-muted-foreground">{guest.phone}</p>
                        {guest.email ? (
                          <p className="text-muted-foreground">{guest.email}</p>
                        ) : null}
                      </section>

                      <section className="rounded-2xl border bg-muted/20 p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                          Stay Information
                        </h3>
                        <dl className="mt-3 space-y-2">
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Check-In</dt>
                            <dd className="font-medium">{search.checkIn}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Check-Out</dt>
                            <dd className="font-medium">{search.checkOut}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Guests</dt>
                            <dd className="font-medium">
                              {search.adults} adult{search.adults === 1 ? "" : "s"}
                              {search.children > 0
                                ? `, ${search.children} child${search.children === 1 ? "" : "ren"}`
                                : ""}
                            </dd>
                          </div>
                        </dl>
                      </section>

                      <section className="rounded-2xl border bg-muted/20 p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                          Room Details
                        </h3>
                        <p className="mt-3 font-medium">{selected.name}</p>
                        <p className="text-muted-foreground">
                          {formatCurrency(selected.pricePerNight)} / night
                        </p>
                      </section>

                      <section className="rounded-2xl border bg-muted/20 p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                          Extras
                        </h3>
                        <p className="mt-3 font-medium">
                          {extrasSummary.length > 0
                            ? extrasSummary.join(", ")
                            : "None selected"}
                        </p>
                      </section>

                      <section className="rounded-2xl border bg-muted/20 p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                          Special Requests
                        </h3>
                        <p className="mt-3 text-muted-foreground">
                          {buildSpecialRequests(
                            search.specialRequests,
                            selectedExtras,
                            additionalNotes
                          ) || "None"}
                        </p>
                      </section>
                    </div>
                  </div>

                  <form
                    className="rounded-[1.75rem] border bg-card p-6 shadow-sm sm:p-8"
                    onSubmit={confirmBooking}
                  >
                    <div className="space-y-4">
                      <label className="flex cursor-pointer items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-brand-gold"
                          checked={agreeCancellation}
                          onChange={(e) => setAgreeCancellation(e.target.checked)}
                        />
                        <span>
                          I agree to the cancellation policy.{" "}
                          <span className="text-muted-foreground">
                            {hotelPolicies.cancellation}
                          </span>
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-brand-gold"
                          checked={agreePrivacy}
                          onChange={(e) => setAgreePrivacy(e.target.checked)}
                        />
                        <span>
                          I agree to the privacy policy. Your contact details will be used
                          only to process and confirm this reservation.
                        </span>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="mt-6 w-full bg-brand-gold text-brand-navy hover:bg-brand-gold/90"
                      disabled={!canComplete}
                    >
                      <Check className="h-4 w-4" />
                      {isSubmitting ? "Submitting…" : "Complete Reservation"}
                    </Button>
                    {submitError ? (
                      <p className="mt-3 text-sm text-destructive" role="alert">
                        {submitError}
                      </p>
                    ) : null}
                  </form>
                </div>

                <aside
                  className="rounded-[1.75rem] border border-brand-gold/30 bg-gradient-to-b from-brand-navy to-brand-navy/95 p-6 text-white shadow-lg lg:sticky lg:top-28"
                  aria-label="Reservation estimate"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-brand-gold">
                    Reservation Estimate
                  </p>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/70">Room Rate</dt>
                      <dd>{formatCurrency(selected.pricePerNight)} / night</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/70">Number of Nights</dt>
                      <dd>{reviewPricing.nights}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/70">Subtotal</dt>
                      <dd>{formatCurrency(reviewPricing.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/70">
                        Taxes ({reviewPricing.taxLabel}%)
                      </dt>
                      <dd>{formatCurrency(reviewPricing.taxes)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/70">
                        Service Charge ({reviewPricing.serviceLabel}%)
                      </dt>
                      <dd>{formatCurrency(reviewPricing.service)}</dd>
                    </div>
                  </dl>
                  <div className="my-5 border-t border-white/15" />
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm font-semibold">Estimated Total</span>
                    <span className="font-serif text-3xl font-bold text-brand-gold">
                      {formatCurrency(reviewPricing.total)}
                    </span>
                  </div>
                  <dl className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/70">Payment Method</dt>
                      <dd>Pay at hotel / upon confirmation</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/70">Reservation Status</dt>
                      <dd className="text-amber-200">Pending Confirmation</dd>
                    </div>
                  </dl>
                  <p className="mt-6 text-xs leading-relaxed text-white/65">
                    Important: This is a reservation request. Our team will contact you to
                    confirm availability and finalize your booking. Extras are subject to
                    availability.
                  </p>
                </aside>
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
