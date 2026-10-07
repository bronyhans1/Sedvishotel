export type AssignmentRoomChoice = {
  roomTypeUuid: string;
  roomTypeName: string;
  roomNumber: string;
};

export type AssignmentRoomOffer<T> = {
  hasPreference: boolean;
  preferred: T[];
  alternatives: T[];
  visible: T[];
};

/**
 * Groups with no stored preference keep every available room.
 * A stored room-type UUID limits the default list to that type.
 * Other available rooms stay hidden until staff explicitly enable them.
 */
export function assignmentRoomOffer<T extends AssignmentRoomChoice>(
  rooms: T[],
  preferredRoomTypeId: string | null | undefined,
  showOtherRoomTypes: boolean
): AssignmentRoomOffer<T> {
  const preference = preferredRoomTypeId?.trim() || null;
  if (!preference) {
    return {
      hasPreference: false,
      preferred: rooms,
      alternatives: [],
      visible: rooms,
    };
  }
  const preferred = rooms.filter((room) => room.roomTypeUuid === preference);
  const alternatives = rooms.filter((room) => room.roomTypeUuid !== preference);
  return {
    hasPreference: true,
    preferred,
    alternatives,
    visible: showOtherRoomTypes ? [...preferred, ...alternatives] : preferred,
  };
}

export function groupAvailableRoomsByType<T extends AssignmentRoomChoice>(
  rooms: T[]
): { roomTypeName: string; rooms: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const room of rooms) {
    const name = room.roomTypeName || "Room";
    const current = groups.get(name);
    if (current) current.push(room);
    else groups.set(name, [room]);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([roomTypeName, grouped]) => ({
      roomTypeName,
      rooms: [...grouped].sort((left, right) =>
        left.roomNumber.localeCompare(right.roomNumber, undefined, { numeric: true })
      ),
    }));
}

/** Estimate only. Actual reservation and folio totals are not derived from this. */
export function preferredRoomEstimate(input: {
  nightlyRate: number;
  roomCount: number;
  nights: number;
}): { nights: number; roomCount: number; nightlyRate: number; subtotal: number } | null {
  const nights = input.nights;
  const roomCount = input.roomCount;
  if (!Number.isFinite(input.nightlyRate) || input.nightlyRate < 0) return null;
  if (!Number.isFinite(roomCount) || roomCount <= 0) return null;
  if (!Number.isFinite(nights) || nights <= 0) return null;
  return {
    nights,
    roomCount,
    nightlyRate: input.nightlyRate,
    subtotal: input.nightlyRate * nights * roomCount,
  };
}
