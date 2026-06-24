"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Users } from "lucide-react";
import { useState } from "react";

import { PublicDateInput } from "@/components/public/PublicDateInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StickyBookingBar() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
    });
    router.push(`/book?${params.toString()}`);
    setMobileOpen(false);
  }

  const fields = (
    <>
      <div className="min-w-0 space-y-1">
        <Label className="text-xs text-muted-foreground">Check-In</Label>
        <PublicDateInput
          value={checkIn}
          min={today}
          onChange={(e) => setCheckIn(e.target.value)}
          required
        />
      </div>
      <div className="min-w-0 space-y-1">
        <Label className="text-xs text-muted-foreground">Check-Out</Label>
        <PublicDateInput
          value={checkOut}
          min={checkIn || today}
          onChange={(e) => setCheckOut(e.target.value)}
          required
        />
      </div>
      <div className="min-w-0 space-y-1">
        <Label className="text-xs text-muted-foreground">Adults</Label>
        <div className="relative">
          <Users className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="number"
            min={1}
            max={6}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="min-h-11 pl-9"
            required
          />
        </div>
      </div>
      <div className="min-w-0 space-y-1">
        <Label className="text-xs text-muted-foreground">Children</Label>
        <Input
          type="number"
          min={0}
          max={4}
          value={children}
          onChange={(e) => setChildren(Number(e.target.value))}
          className="min-h-11"
        />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sticky bar */}
      <div className="sticky top-16 z-40 hidden border-b bg-card/95 shadow-md backdrop-blur-md lg:block">
        <form
          onSubmit={submit}
          className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_100px_auto] items-end gap-4 px-6 py-4 lg:px-8"
        >
          {fields}
          <Button
            type="submit"
            className="h-11 shrink-0 bg-brand-gold text-brand-navy hover:bg-brand-gold/90 public-btn-lift"
          >
            Check Availability
          </Button>
        </form>
      </div>

      {/* Mobile drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card shadow-2xl pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex min-h-12 w-full items-center justify-between px-4 py-3 font-semibold text-brand-navy"
        >
          <span>Book Your Stay</span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
          />
        </button>
        {mobileOpen && (
          <form
            onSubmit={submit}
            className="grid max-h-[min(70vh,28rem)] gap-3 overflow-y-auto border-t px-4 pb-4 pt-3"
          >
            {fields}
            <Button type="submit" className="min-h-11 bg-brand-gold text-brand-navy">
              Check Availability
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
