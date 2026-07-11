import { siteConfig } from "@/config/site";

/** Centralized SEDVIS HOTEL contact — single source for the public website */

export const hotelContact = {
  name: siteConfig.name,
  phone: "+233 24 984 7397",
  phoneDisplay: "+233 24 984 7397",
  phoneTel: "+233249847397",
  reservationsEmail: "reservations@sedvishotel.com",
  /** Public-facing contact email (same as reservations) */
  generalEmail: "reservations@sedvishotel.com",
  emergencyPhone: "+233 24 984 7397",
  streetAddress: "Alaye - Off UHAS New Road",
  city: "Ho",
  region: "Volta Region",
  country: "Ghana",
  shortLocation: "Ho, Volta Region, Ghana",
  fullLocation: "Ho, Volta Region, Ghana",
  addressLines: [
    "SEDVIS HOTEL",
    "Alaye - Off UHAS New Road",
    "Ho, Volta Region",
    "Ghana",
  ] as const,
  /** Single-line address for schema and compact displays */
  address:
    "SEDVIS HOTEL, Alaye - Off UHAS New Road, Ho, Volta Region, Ghana",
  responseTime: "We aim to respond to enquiries as promptly as possible.",
} as const;
