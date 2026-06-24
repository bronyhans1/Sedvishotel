export type PublicRoom = {
  id: string;
  slug: string;
  /** Marketing display name shown on the public website */
  name: string;
  /** Public category slug — decoupled from SHMS room types */
  categoryId: string;
  description: string;
  longDescription: string;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  images: string[];
  featured?: boolean;
  /** Bed options offered during booking for this category */
  bedPreferences: string[];
};

export type GalleryItem = {
  id: string;
  title: string;
  category: GalleryCategory;
  image: string;
  aspect: "square" | "tall" | "wide";
};

export type GalleryCategory =
  | "all"
  | "rooms"
  | "corridors";

export type BookingSearch = {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomTypeId?: string;
  bedPreference?: string;
  specialRequests?: string;
};

export type BookingGuest = {
  fullName: string;
  email: string;
  phone: string;
};

export type BookingConfirmation = {
  reservationNumber: string;
  guestName: string;
  email: string;
  roomName: string;
  roomSlug: string;
  bedPreference?: string;
  bedPreferenceLabel?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nights: number;
  subtotal: number;
  taxes: number;
  total: number;
  status: "confirmed" | "pending";
  paymentStatus: "deposit_paid" | "pending";
};

export type ReservationLookupResult = {
  reservationNumber: string;
  guestName: string;
  email: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  paymentStatus: string;
};
