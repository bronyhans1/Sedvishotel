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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <header
        className={cn(
          "public-glass-nav mx-auto w-full max-w-[1400px] overflow-hidden rounded-3xl border text-white shadow-lg transition-all duration-300 lg:w-[92%]",
          scrolled ? "public-glass-nav-scrolled" : "public-glass-nav-default"
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
                  "text-sm font-medium transition-colors hover:text-brand-gold",
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
              className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90"
            >
              <Link href="/book">Book Now</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              asChild
              size="sm"
              className="h-10 shrink-0 bg-brand-gold px-3 text-brand-navy hover:bg-brand-gold/90"
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
              <Button asChild className="mt-1 min-h-11 bg-brand-gold text-brand-navy">
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
