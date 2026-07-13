import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import Script from "next/script";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { FloatingCallSupport } from "@/components/public/FloatingCallSupport";
import { loadPublicRooms } from "@/lib/public/load-public-rooms";
import { hotelJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/public-seo";

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

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publicRooms = await loadPublicRooms();
  const accommodationLinks = publicRooms.map((room) => ({
    slug: room.slug,
    name: room.name,
  }));

  return (
    <div
      className={`${playfair.variable} public-site flex min-h-screen flex-col overflow-x-hidden font-sans`}
    >
      <Script
        id="hotel-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd()) }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <PublicNavbar />
      <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] max-md:[&:has(.public-home-page)]:pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {children}
      </main>
      <PublicFooter accommodationLinks={accommodationLinks} />
      <FloatingCallSupport />
    </div>
  );
}
