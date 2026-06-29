import { siteConfig } from "@/config/site";

/** Centralized hotel facts — replace with official SEDVIS HOTEL data */

export const hotelInformation = {
  name: siteConfig.name,
  tagline: "Experience comfort, elegance and exceptional hospitality.",
  heroHeadline: "Welcome to SEDVIS HOTEL",
  heroSubheadline:
    "Experience refined comfort in the heart of Ho.",
  receptionHours: "24/7",
  description:
    "SEDVIS HOTEL is a premium hospitality destination in Ho, Volta Region, Ghana, offering refined accommodations and world-class service.",
  websiteUrl: "https://www.sedvis-hotel.com",
} as const;

export const hotelBrandPillars = [
  { primary: "Comfortable", secondary: "Rooms" },
  { primary: "24/7", secondary: "Reception" },
  { primary: "Exceptional", secondary: "Service" },
  { primary: "Premium", secondary: "Accommodation" },
] as const;
