"use client";

import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";

import { hotelContact } from "@/config/hotel-contact";
import { cn } from "@/lib/utils";

export function FloatingCallSupport() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div
      className={cn(
        "fixed right-4 z-[55] md:right-5 md:bottom-5",
        isHome
          ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]"
          : "bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
      )}
    >
      <a
        href={`tel:${hotelContact.phoneTel}`}
        className="public-call-pulse public-call-card hidden items-center gap-4 rounded-2xl border border-white/10 bg-brand-navy px-5 py-4 text-white shadow-xl transition-transform hover:scale-[1.02] md:flex"
        aria-label="Call SEDVIS HOTEL"
      >
        <div className="text-sm leading-snug">
          <p className="font-medium text-brand-gold">Need Assistance?</p>
          <p className="text-white/90">Talk To Us</p>
          <p className="mt-1 font-semibold tracking-wide">Call Now</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-navy">
          <Phone className="h-6 w-6" aria-hidden />
        </span>
      </a>

      <a
        href={`tel:${hotelContact.phoneTel}`}
        className="public-call-pulse flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-brand-navy shadow-lg transition-transform hover:scale-110 md:hidden"
        aria-label="Call now"
      >
        <Phone className="h-7 w-7" aria-hidden />
      </a>
    </div>
  );
}
