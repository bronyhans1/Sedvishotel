"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { PublicLogo } from "@/components/public/PublicLogo";
import { Button } from "@/components/ui/button";
import { publicNavLinks } from "@/config/public-site";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "z-50 px-4 pt-4 sm:px-6 lg:px-8",
        isHome ? "absolute inset-x-0 top-0" : "sticky top-0"
      )}
    >
      <header
        className={cn(
          "public-glass-nav mx-auto w-full max-w-[1400px] overflow-hidden rounded-3xl border text-white transition-all duration-500 ease-out lg:w-[92%]",
          scrolled ? "public-glass-nav-scrolled" : "public-glass-nav-default",
          !isHome && !scrolled && "public-glass-nav-scrolled"
        )}
      >
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6">
          <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
            <PublicLogo size={40} showName nameClassName="text-white" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {publicNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium tracking-wide transition-colors duration-300 hover:text-brand-gold",
                  pathname === link.href && "text-brand-gold"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex">
            <Button
              asChild
              className="border border-brand-gold/30 bg-brand-gold text-brand-navy shadow-[0_8px_22px_-10px_rgba(201,162,39,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#d4af37] hover:shadow-[0_12px_28px_-10px_rgba(201,162,39,0.65)]"
            >
              <Link href="/book">Book Now</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              asChild
              size="sm"
              className="h-10 shrink-0 bg-brand-gold px-3 text-brand-navy hover:bg-[#d4af37]"
            >
              <Link href="/book">Book Now</Link>
            </Button>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-white/10 px-4 py-4 md:hidden">
            <div className="mb-4 flex justify-center">
              <PublicLogo size={48} />
            </div>
            <nav className="flex flex-col gap-3">
              {publicNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center py-2 text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Button asChild className="mt-1 min-h-11 bg-brand-gold text-brand-navy hover:bg-[#d4af37]">
                <Link href="/book" onClick={() => setOpen(false)}>
                  Book Now
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}
