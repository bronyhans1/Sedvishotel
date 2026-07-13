import type { Metadata, MetadataRoute } from "next";

import { hotelContact } from "@/config/hotel-contact";
import { hotelInformation } from "@/config/hotel-information";
import { getPublicSiteUrl } from "@/config/public-site-url";
import { publicNavLinks, publicSiteConfig } from "@/config/public-site";
import { publicImages } from "@/lib/public/images";

/** Canonical public site origin — re-exported for consumers that already import from here. */
export { getPublicSiteUrl } from "@/config/public-site-url";

export function getSocialShareImageUrl(): string {
  return `${getPublicSiteUrl()}${publicImages.socialShare}`;
}

/** Indexable public routes (excludes transactional confirmation). */
export const publicSitemapStaticPaths = [
  ...publicNavLinks.map((link) => link.href),
  "/book",
  "/reservation-lookup",
] as const;

type PublicSeoOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
};

export function buildPublicMetadata({
  title,
  description,
  path = "",
  keywords,
}: PublicSeoOptions): Metadata {
  const url = `${getPublicSiteUrl()}${path}`;
  const imageUrl = getSocialShareImageUrl();

  return {
    title: { absolute: title },
    description,
    ...(keywords?.length ? { keywords } : {}),
    metadataBase: new URL(getPublicSiteUrl()),
    openGraph: {
      type: "website",
      locale: "en_GH",
      url,
      siteName: hotelInformation.name,
      title,
      description,
      images: [
        {
          url: imageUrl,
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
      images: [imageUrl],
    },
    alternates: { canonical: url },
  };
}

export function hotelJsonLd() {
  const canonicalUrl = getPublicSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotelInformation.name,
    description: hotelInformation.description,
    url: canonicalUrl,
    telephone: hotelContact.phoneTel,
    email: hotelContact.reservationsEmail,
    image: getSocialShareImageUrl(),
    address: {
      "@type": "PostalAddress",
      streetAddress: hotelContact.streetAddress,
      addressLocality: hotelContact.city,
      addressRegion: hotelContact.region,
      addressCountry: hotelContact.country,
      name: hotelContact.name,
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

export function organizationJsonLd() {
  const canonicalUrl = getPublicSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: hotelInformation.name,
    url: canonicalUrl,
    logo: `${canonicalUrl}${publicImages.logo}`,
    image: getSocialShareImageUrl(),
    telephone: hotelContact.phoneTel,
    email: hotelContact.reservationsEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: hotelContact.streetAddress,
      addressLocality: hotelContact.city,
      addressRegion: hotelContact.region,
      addressCountry: hotelContact.country,
      name: hotelContact.name,
    },
    sameAs: publicSiteConfig.social.map((link) => link.href),
  };
}

export function websiteJsonLd() {
  const canonicalUrl = getPublicSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: hotelInformation.name,
    url: canonicalUrl,
    description: hotelInformation.description,
    publisher: {
      "@type": "Organization",
      name: hotelInformation.name,
      url: canonicalUrl,
    },
    inLanguage: "en-GH",
  };
}

export function buildWebManifest(): MetadataRoute.Manifest {
  const canonicalUrl = getPublicSiteUrl();

  return {
    name: hotelInformation.name,
    short_name: hotelInformation.name,
    description: hotelInformation.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#1e3a5f",
    theme_color: "#1e3a5f",
    lang: "en-GH",
    orientation: "portrait-primary",
    icons: [
      {
        src: publicImages.logo,
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: publicImages.logo,
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
    id: canonicalUrl,
  };
}

export function buildRobotsConfig(): MetadataRoute.Robots {
  const canonicalUrl = getPublicSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/login",
        "/admin",
        "/change-password",
        "/booking/confirmation",
      ],
    },
    sitemap: `${canonicalUrl}/sitemap.xml`,
    host: canonicalUrl,
  };
}

export function buildStaticSitemapEntries(): MetadataRoute.Sitemap {
  const canonicalUrl = getPublicSiteUrl();
  const lastModified = new Date();

  return publicSitemapStaticPaths.map((path) => ({
    url: `${canonicalUrl}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/book" ? 0.9 : 0.8,
  }));
}
