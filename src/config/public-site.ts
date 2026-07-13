import { hotelContact } from "@/config/hotel-contact";
import { hotelInformation } from "@/config/hotel-information";
import { hotelPolicies } from "@/config/hotel-policies";

export type PublicSocialPlatform = "facebook" | "instagram" | "tiktok";

export type PublicSocialLink = {
  platform: PublicSocialPlatform;
  label: string;
  href: string;
};

export const publicSiteConfig = {
  name: hotelInformation.name,
  tagline: hotelInformation.tagline,
  heroHeadline: hotelInformation.heroHeadline,
  heroSubheadline: hotelInformation.heroSubheadline,
  contact: {
    phone: hotelContact.phoneDisplay,
    email: hotelContact.reservationsEmail,
    reservationsEmail: hotelContact.reservationsEmail,
    address: hotelContact.address,
    addressLines: hotelContact.addressLines,
    hours: `24/7 Reception · Check-in ${hotelPolicies.checkInTime} · Check-out ${hotelPolicies.checkOutTime}`,
  },
  social: [
    {
      platform: "facebook",
      label: "Facebook",
      href: "https://facebook.com/sedvishotel",
    },
    {
      platform: "instagram",
      label: "Instagram",
      href: "https://instagram.com/sedvishotel",
    },
    {
      platform: "tiktok",
      label: "TikTok",
      href: "https://tiktok.com/@sedvishotel",
    },
  ] satisfies PublicSocialLink[],
} as const;

export const publicNavLinks = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const publicMetadata = {
  defaultTitle: "SEDVIS HOTEL | Luxury Hotel in Ho, Volta Region",
  rooms: "Rooms & Accommodation | SEDVIS HOTEL Ho",
  gallery: "SEDVIS HOTEL Gallery",
  about: "SEDVIS HOTEL About",
  contact: "SEDVIS HOTEL Contact",
  book: "Book Your Stay | SEDVIS HOTEL",
  confirmation: "Booking Confirmed | SEDVIS HOTEL",
  lookup: "Reservation Lookup | SEDVIS HOTEL",
} as const;
