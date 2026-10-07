const ASSIGNMENT_FAILED_MESSAGE = "Room assignment failed. Please try again.";

export function assignmentSuccessMessage(roomNumber: string, guestName?: string): string {
  const guest = guestName?.trim();
  if (guest && guest.toLowerCase() !== "guest tbd") {
    return `Room ${roomNumber} assigned to ${guest} successfully.`;
  }
  return `Room ${roomNumber} assigned successfully.`;
}

export function assignmentErrorMessage(serverError: string | undefined): string {
  const message = serverError?.trim();
  return message || ASSIGNMENT_FAILED_MESSAGE;
}

const GUEST_ROOM_ASSIGNMENT_FAILED_MESSAGE =
  "Guest and room assignment failed. Please try again.";

export function guestRoomAssignmentErrorMessage(serverError: string | undefined): string {
  const message = serverError?.trim();
  return message || GUEST_ROOM_ASSIGNMENT_FAILED_MESSAGE;
}

/** Same-row claims are rejected. A different row may submit at the same time. */
export function claimAssignmentRow(
  pending: ReadonlySet<string>,
  rowKey: string
): { pending: Set<string>; accepted: boolean } {
  if (pending.has(rowKey)) {
    return { pending: new Set(pending), accepted: false };
  }
  const next = new Set(pending);
  next.add(rowKey);
  return { pending: next, accepted: true };
}

export function releaseAssignmentRow(
  pending: ReadonlySet<string>,
  rowKey: string
): Set<string> {
  const next = new Set(pending);
  next.delete(rowKey);
  return next;
}

export function assignmentRowControls(input: {
  selectedRoom: string;
  guestSelected: boolean;
  pending: ReadonlySet<string>;
  rowKey: string;
  roomsAvailable: boolean;
}): {
  submitting: boolean;
  assignDisabled: boolean;
  selectorDisabled: boolean;
  label: "Assign" | "Assigning…";
} {
  const submitting = input.pending.has(input.rowKey);
  return {
    submitting,
    assignDisabled:
      submitting || !input.selectedRoom || !input.guestSelected || !input.roomsAvailable,
    selectorDisabled: submitting || !input.roomsAvailable,
    label: submitting ? "Assigning…" : "Assign",
  };
}
