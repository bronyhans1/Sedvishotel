/** User-facing message when a concurrent booking wins the same room. */
export const RESERVATION_ROOM_CONFLICT_MESSAGE =
  "This room has just been reserved by another booking. Please choose another available room.";

export class ReservationRoomConflictError extends Error {
  readonly code = "ROOM_CONFLICT" as const;

  constructor(message: string = RESERVATION_ROOM_CONFLICT_MESSAGE) {
    super(message);
    this.name = "ReservationRoomConflictError";
  }
}

type PgLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
};

/** Detects PostgreSQL exclusion violations from Supabase/PostgREST errors. */
export function isReservationOverlapDbError(error: PgLikeError | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "23P01") return true;

  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  return /reservations_no_room_overlap|exclusion constraint/i.test(text);
}

export function throwIfReservationOverlapError(
  error: PgLikeError | null | undefined,
  fallbackMessage: string
): never {
  if (isReservationOverlapDbError(error)) {
    throw new ReservationRoomConflictError();
  }
  throw new Error(fallbackMessage);
}
