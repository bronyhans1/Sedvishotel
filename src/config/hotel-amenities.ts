import {
  BedDouble,
  Car,
  ConciergeBell,
  Coffee,
  Sparkles,
  Tv,
  Wifi,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type HotelAmenity = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const hotelAmenities: HotelAmenity[] = [
  {
    icon: Wifi,
    title: "Free Wi-Fi",
    description: "High-speed connectivity throughout the property.",
  },
  {
    icon: Wind,
    title: "Air Conditioning",
    description: "Climate-controlled comfort in every room.",
  },
  {
    icon: Tv,
    title: "Smart TV",
    description: "In-room entertainment for a relaxing stay.",
  },
  {
    icon: ConciergeBell,
    title: "24/7 Reception",
    description: "Always available to assist our guests.",
  },
  {
    icon: Coffee,
    title: "Room Service",
    description: "In-room dining delivered with care.",
  },
  {
    icon: Car,
    title: "Secure Parking",
    description: "Safe on-site parking for all guests.",
  },
  {
    icon: Sparkles,
    title: "Daily Housekeeping",
    description: "Fresh and clean rooms prepared daily.",
  },
  {
    icon: BedDouble,
    title: "Comfortable Rooms",
    description: "Designed for relaxation and peaceful nights.",
  },
];

export const trustSignals = [
  { title: "Secure Reservations", description: "Encrypted booking and protected guest data." },
  { title: "Instant Confirmation", description: "Receive your reservation number immediately." },
  { title: "Best Available Rates", description: "Book direct for preferred guest pricing." },
  { title: "Professional Hospitality", description: "Trained team delivering five-star service." },
  { title: "24/7 Guest Support", description: "Assistance whenever you need it." },
] as const;
