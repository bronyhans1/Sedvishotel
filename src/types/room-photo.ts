export type RoomPhotoSource = "room" | "room_type" | "none";

export type RoomPhoto = {
  id: string;
  url: string;
  fileName: string | null;
  displayOrder: number;
  isCover: boolean;
};

export type RoomPhotoGallery = {
  photos: RoomPhoto[];
  source: RoomPhotoSource;
  /** True when room page is showing inherited room-type photos */
  inheritedFromRoomType?: boolean;
};
