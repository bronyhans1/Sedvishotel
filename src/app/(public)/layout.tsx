import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import Script from "next/script";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { FloatingCallSupport } from "@/components/public/FloatingCallSupport";
import { hotelJsonLd } from "@/lib/public-seo";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${playfair.variable} public-site flex min-h-screen flex-col overflow-x-hidden font-sans`}
    >
      <Script
        id="hotel-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd()) }}
      />
      <PublicNavbar />
      <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] max-md:[&:has(.public-home-page)]:pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {children}
      </main>
      <PublicFooter />
      <FloatingCallSupport />
    </div>
  );
}
