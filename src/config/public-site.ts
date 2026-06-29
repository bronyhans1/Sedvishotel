import { hotelContact } from "@/config/hotel-contact";
import { hotelInformation } from "@/config/hotel-information";
import { hotelPolicies } from "@/config/hotel-policies";

export const publicSiteConfig = {
  name: hotelInformation.name,
  tagline: hotelInformation.tagline,
  heroHeadline: hotelInformation.heroHeadline,
  heroSubheadline: hotelInformation.heroSubheadline,
  contact: {
    phone: hotelContact.phoneDisplay,
    email: hotelContact.generalEmail,
    reservationsEmail: hotelContact.reservationsEmail,
    address: hotelContact.address,
    hours: `24/7 Reception · Check-in ${hotelPolicies.checkInTime} · Check-out ${hotelPolicies.checkOutTime}`,
  },
  social: [
    { label: "Facebook", href: "https://facebook.com" },
    { label: "Instagram", href: "https://instagram.com" },
    { label: "X", href: "https://twitter.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
  ],
} as const;

export const publicNavLinks = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const publicMetadata = {
  defaultTitle: "SEDVIS HOTEL | Luxury Hotel Experience",
  rooms: "SEDVIS HOTEL Rooms",
  gallery: "SEDVIS HOTEL Gallery",
  about: "SEDVIS HOTEL About",
  contact: "SEDVIS HOTEL Contact",
  book: "Book Your Stay | SEDVIS HOTEL",
  confirmation: "Booking Confirmed | SEDVIS HOTEL",
  lookup: "Reservation Lookup | SEDVIS HOTEL",
} as const;
