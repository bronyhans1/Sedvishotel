"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { PublicBookButton } from "@/components/public/PublicBookButton";
import { PublicLogo } from "@/components/public/PublicLogo";
import { hotelContact } from "@/config/hotel-contact";
import { hotelInformation } from "@/config/hotel-information";
import { publicNavLinks, publicSiteConfig } from "@/config/public-site";
import { publicRooms } from "@/lib/mock-data/public-rooms";

export function PublicFooter() {
  const { social, name, tagline } = publicSiteConfig;

  return (
    <footer className="border-t bg-brand-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <PublicLogo size={44} showName nameClassName="text-white text-xl" />
            <p className="text-sm leading-relaxed text-white/70">{tagline}</p>
            <p className="text-sm text-white/60">{hotelInformation.description}</p>
            <PublicBookButton size="sm" className="mt-2" />
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              {publicNavLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-brand-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/book" className="transition-colors hover:text-brand-gold">
                  Book Now
                </Link>
              </li>
              <li>
                <Link href="/reservation-lookup" className="transition-colors hover:text-brand-gold">
                  Reservation Lookup
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Accommodations
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              {publicRooms.map((room) => (
                <li key={room.slug}>
                  <Link
                    href={`/rooms/${room.slug}`}
                    className="transition-colors hover:text-brand-gold"
                  >
                    {room.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Contact Information
            </h3>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                {hotelContact.address}
              </li>
              <li className="flex gap-2">
                <Phone className="h-4 w-4 shrink-0 text-brand-gold" />
                <a href={`tel:${hotelContact.phoneTel}`} className="hover:text-brand-gold">
                  {hotelContact.phoneDisplay}
                </a>
              </li>
              <li className="flex gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand-gold" />
                <a href={`mailto:${hotelContact.reservationsEmail}`} className="hover:text-brand-gold">
                  {hotelContact.reservationsEmail}
                </a>
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              {social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-xs font-medium transition-colors hover:border-brand-gold hover:text-brand-gold"
                  aria-label={s.label}
                >
                  {s.label[0]}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {name}. All rights reserved. · Guest rooms ·{" "}
        {hotelContact.shortLocation}
      </div>
    </footer>
  );
}
