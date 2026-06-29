export type RoomStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "cleaning"
  | "maintenance";

/** @deprecated Legacy enum — use dynamic floors via floorId */
export type FloorId = "ground" | "first" | "second" | "third";

export type FloorFilterValue = string | "all";

export type StatusFilterValue = RoomStatus | "all";

export type RoomViewMode = "table" | "grid";

export type Room = {
  id: string;
  uuid: string;
  roomNumber: string;
  floorId: string;
  floorLabel: string;
  floorDisplayOrder: number;
  status: RoomStatus;
  roomTypeId: string;
  roomTypeUuid: string;
  roomType: string;
  price: number;
  capacity: number;
  description: string;
  notes?: string;
  amenities: string[];
};

export type RoomStats = {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  cleaning: number;
  maintenance: number;
};

export type RoomActivity = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "check-in" | "check-out" | "cleaning" | "maintenance" | "note";
};

export type RoomFormValues = {
  roomNumber: string;
  floorId: string;
  roomTypeId: string;
  status: RoomStatus;
  notes: string;
};

export type RoomTypeOption = {
  id: string;
  name: string;
  capacity: number;
  defaultPrice: number;
};

export const STATUS_OPTIONS: { value: RoomStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "reserved", label: "Reserved" },
  { value: "cleaning", label: "Cleaning" },
  { value: "maintenance", label: "Maintenance" },
];
