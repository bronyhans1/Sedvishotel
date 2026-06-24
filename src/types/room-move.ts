import type { TransactionPaymentMethod } from "@/types/payment";

export const ROOM_MOVE_REASONS = [
  "Maintenance",
  "Guest Request",
  "Upgrade",
  "Downgrade",
  "Noise Complaint",
  "Other",
] as const;

export type RoomMoveReason = (typeof ROOM_MOVE_REASONS)[number];

export type RoomMoveRecord = {
  fromRoom: string;
  toRoom: string;
  reason: string;
  notes?: string;
  priceDifference: number;
  movedAt: string;
};

export type RoomMoveOption = {
  roomNumber: string;
  roomTypeName: string;
  floorLabel: string;
  nightlyRate: number;
};

export type RoomMoveInput = {
  newRoomNumber: string;
  reason: RoomMoveReason;
  notes?: string;
  paymentMethod?: TransactionPaymentMethod;
};

export type RoomMovePreview = {
  reservationId: string;
  reservationNumber: string;
  guestName: string;
  currentRoomNumber: string;
  currentRoomTypeName: string;
  currentFloorLabel: string;
  newRoomNumber: string;
  newRoomTypeName: string;
  newFloorLabel: string;
  newNightlyRate: number;
  priceDifference: number;
  availableRooms: RoomMoveOption[];
};
