/** Centralized policies — replace with official SEDVIS HOTEL policy text */

export const hotelPolicies = {
  checkInTime: "2:00 PM",
  checkOutTime: "11:00 AM",
  cancellation:
    "Free cancellation up to 24 hours before arrival. Cancellations within 24 hours may incur one night's charge unless otherwise agreed in writing.",
  roomRules: [
    "No smoking in guest rooms (designated areas available)",
    "Quiet hours from 10:00 PM to 7:00 AM",
    "Valid government-issued ID required at check-in",
    "Maximum occupancy per room type must be observed",
    "Pets not permitted except registered service animals",
  ],
  highlights: [
    "Premium linens and daily housekeeping",
    "In-room safe and climate control",
    "Complimentary Wi-Fi",
    "Airport City location — minutes from Kotoka International Airport",
  ],
} as const;
