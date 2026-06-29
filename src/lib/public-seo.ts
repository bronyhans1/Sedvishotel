import type { Metadata } from "next";

import { hotelContact } from "@/config/hotel-contact";
import { hotelInformation } from "@/config/hotel-information";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sedvis-hotel.com";

type PublicSeoOptions = {
  title: string;
  description: string;
  path?: string;
};

export function buildPublicMetadata({
  title,
  description,
  path = "",
}: PublicSeoOptions): Metadata {
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "en_GH",
      url,
      siteName: hotelInformation.name,
      title,
      description,
      images: [
        {
          url: `${siteUrl}/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: `${hotelInformation.name} — Luxury Hotel in Ho, Volta Region`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/og-default.jpg`],
    },
    alternates: { canonical: url },
  };
}

export function hotelJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotelInformation.name,
    description: hotelInformation.description,
    url: siteUrl,
    telephone: hotelContact.phoneTel,
    email: hotelContact.reservationsEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: hotelContact.address,
      addressLocality: hotelContact.city,
      addressRegion: hotelContact.region,
      addressCountry: hotelContact.country,
    },
    priceRange: "GH₵₵₵",
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Free WiFi", value: true },
      { "@type": "LocationFeatureSpecification", name: "Air Conditioning", value: true },
      { "@type": "LocationFeatureSpecification", name: "24/7 Reception", value: true },
      { "@type": "LocationFeatureSpecification", name: "Secure Parking", value: true },
    ],
  };
}
