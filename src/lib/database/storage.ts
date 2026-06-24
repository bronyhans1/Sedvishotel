/** Supabase Storage bucket definitions */
export const StorageBuckets = {
  hotelAssets: "hotel-assets",
  roomImages: "room-images",
  guestDocuments: "guest-documents",
  staffAvatars: "staff-avatars",
} as const;

export type StorageBucket = (typeof StorageBuckets)[keyof typeof StorageBuckets];

/** Recommended object path conventions */
export const StoragePaths = {
  hotelLogo: () => "branding/logo",
  roomImage: (roomNumber: string, filename: string) =>
    `rooms/${roomNumber}/${filename}`,
  roomTypeImage: (slug: string, filename: string) =>
    `room-types/${slug}/${filename}`,
  guestDocument: (guestId: string, filename: string) =>
    `guests/${guestId}/${filename}`,
  staffAvatar: (userId: string) => `staff/${userId}/avatar`,
} as const;

export const StoragePolicySummary = {
  [StorageBuckets.hotelAssets]: {
    public: true,
    description: "Logo, favicon, marketing assets",
    maxSizeMb: 5,
  },
  [StorageBuckets.roomImages]: {
    public: true,
    description: "Room gallery and thumbnails",
    maxSizeMb: 5,
  },
  [StorageBuckets.guestDocuments]: {
    public: false,
    description: "ID scans, signed forms — encrypted at rest",
    maxSizeMb: 15,
  },
  [StorageBuckets.staffAvatars]: {
    public: true,
    description: "Staff profile avatars (staff-avatars bucket)",
    maxSizeMb: 5,
  },
} as const;
