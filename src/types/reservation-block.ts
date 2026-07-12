export type ReservationBlockStatus =
  | "blocked"
  | "allocated"
  | "released"
  | "cancelled"
  | "expired";

export type ReservationBlock = {
  id: string;
  groupReservationId: string;
  roomId: string;
  roomTypeId: string;
  holdUntil: string;
  releasedAt: string | null;
  status: ReservationBlockStatus;
  createdBy: string | null;
  createdAt: string;
};

export type CreateReservationBlockInput = {
  groupReservationId: string;
  roomId: string;
  roomTypeId: string;
  holdUntil: string;
};
