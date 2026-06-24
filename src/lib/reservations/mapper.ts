import { resolveFloorLabel } from "@/lib/rooms/mapper";
import { isLateCheckoutReservation } from "@/lib/reservations/late-checkout";
import { formatCurrency } from "@/lib/utils";
import type { DbReservationWithRelations } from "@/types/database";
import type {
  Reservation,
  ReservationStats,
  ReservationTimelineEvent,
} from "@/types/reservation";
import type { StayExtensionRecord } from "@/types/extend-stay";
import type { RoomMoveRecord } from "@/types/room-move";

function parseStayExtensionHistory(value: unknown): StayExtensionRecord[] {
  if (!Array.isArray(value)) return [];
  const records: StayExtensionRecord[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.from_checkout !== "string" || typeof row.to_checkout !== "string") {
      continue;
    }
    const record: StayExtensionRecord = {
      fromCheckout: row.from_checkout,
      toCheckout: row.to_checkout,
      extraNights: Number(row.extra_nights ?? 0),
      extraAmount: Number(row.extra_amount ?? 0),
      extendedAt: String(row.extended_at ?? ""),
    };
    if (typeof row.notes === "string") record.notes = row.notes;
    records.push(record);
  }
  return records;
}

function parseRoomMoveHistory(value: unknown): RoomMoveRecord[] {
  if (!Array.isArray(value)) return [];
  const records: RoomMoveRecord[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.from_room !== "string" || typeof row.to_room !== "string") {
      continue;
    }
    const record: RoomMoveRecord = {
      fromRoom: row.from_room,
      toRoom: row.to_room,
      reason: String(row.reason ?? ""),
      priceDifference: Number(row.price_difference ?? 0),
      movedAt: String(row.moved_at ?? ""),
    };
    if (typeof row.notes === "string") record.notes = row.notes;
    records.push(record);
  }
  return records;
}

export function mapDbReservationToReservation(
  row: DbReservationWithRelations
): Reservation {
  const guest = row.guest;
  const room = row.room;
  const roomType = row.room_type;

  return {
    id: row.id,
    reservationNumber: row.reservation_number,
    guestName: guest.full_name,
    guestPhone: guest.phone ?? "",
    guestEmail: guest.email ?? "",
    roomNumber: room.room_number,
    roomTypeId: roomType.slug,
    roomTypeName: roomType.name,
    floorLabel: resolveFloorLabel(room),
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    adults: row.adults,
    children: row.children,
    status: row.status as Reservation["status"],
    bookingSource: row.booking_source,
    roomRate: Number(row.room_rate),
    numberOfNights: row.number_of_nights,
    subtotal: Number(row.subtotal),
    taxes: Number(row.taxes),
    totalAmount: Number(row.total_amount),
    amountPaid: Number(row.amount_paid),
    balance: Number(row.balance),
    createdAt: row.created_at,
    originalCheckOutDate: row.original_check_out_date,
    actualCheckOutDate: row.actual_check_out_date,
    earlyCheckOutReason: row.early_checkout_reason,
    earlyCheckOutNotes: row.early_checkout_notes,
    earlyCheckOutRefundAmount:
      row.early_checkout_refund_amount != null
        ? Number(row.early_checkout_refund_amount)
        : null,
    lateCheckOutFee:
      row.late_checkout_fee != null ? Number(row.late_checkout_fee) : null,
    lateCheckOutReason: row.late_checkout_reason,
    lateCheckOutNotes: row.late_checkout_notes,
    lateCheckOutAt: row.late_checkout_at,
    lateCheckOutComplimentary: row.late_checkout_complimentary,
    lateCheckOutHoursLate:
      row.late_checkout_hours_late != null
        ? Number(row.late_checkout_hours_late)
        : null,
    lateCheckOutPolicyType: row.late_checkout_policy_type,
    stayExtensionHistory: parseStayExtensionHistory(row.stay_extension_history),
    roomMoveHistory: parseRoomMoveHistory(row.room_move_history),
  };
}

export function computeReservationStats(
  reservations: Reservation[]
): ReservationStats {
  return reservations.reduce<ReservationStats>(
    (acc, r) => {
      acc.total += 1;
      if (r.status === "pending") acc.pending += 1;
      if (r.status === "confirmed") acc.confirmed += 1;
      if (r.status === "checked_in") acc.checkedIn += 1;
      if (r.status === "checked_out" || r.status === "checked_out_early") acc.checkedOut += 1;
      if (r.status === "cancelled") acc.cancelled += 1;
      return acc;
    },
    {
      total: 0,
      pending: 0,
      confirmed: 0,
      checkedIn: 0,
      checkedOut: 0,
      cancelled: 0,
    }
  );
}

export function buildReservationTimeline(
  reservation: Reservation
): ReservationTimelineEvent[] {
  return [
    {
      id: "1",
      title: "Reservation Created",
      description: `Booking ${reservation.reservationNumber} registered`,
      timestamp: new Date(reservation.createdAt).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      completed: true,
      icon: "created",
    },
    {
      id: "2",
      title: "Payment Received",
      description:
        reservation.amountPaid > 0
          ? `GH₵ ${reservation.amountPaid.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} received`
          : "Awaiting payment",
      timestamp: reservation.amountPaid > 0 ? "Recorded" : "Pending",
      completed: reservation.amountPaid > 0,
      icon: "payment",
    },
    {
      id: "3",
      title: "Reservation Confirmed",
      description: "Guest booking confirmed by front desk",
      timestamp:
        reservation.status !== "pending" && reservation.status !== "cancelled"
          ? "Confirmed"
          : "Pending",
      completed: ["confirmed", "checked_in", "checked_out", "checked_out_early"].includes(
        reservation.status
      ),
      icon: "confirmed",
    },
    {
      id: "4",
      title: "Check-In",
      description: `Room ${reservation.roomNumber} · ${reservation.checkInDate}`,
      timestamp: reservation.checkInDate,
      completed: ["checked_in", "checked_out", "checked_out_early"].includes(
        reservation.status
      ),
      icon: "check-in",
    },
    {
      id: "5",
      title: "Check-Out",
      description:
        reservation.status === "checked_out_early" && reservation.actualCheckOutDate
          ? `Early checkout ${reservation.actualCheckOutDate}`
          : isLateCheckoutReservation(reservation.lateCheckOutAt)
            ? reservation.lateCheckOutComplimentary
              ? "Late checkout · Complimentary"
              : `Late checkout · ${formatCurrency(reservation.lateCheckOutFee ?? 0)}`
            : `Scheduled ${reservation.checkOutDate}`,
      timestamp:
        reservation.status === "checked_out_early" && reservation.actualCheckOutDate
          ? reservation.actualCheckOutDate
          : reservation.lateCheckOutAt ?? reservation.checkOutDate,
      completed:
        reservation.status === "checked_out" ||
        reservation.status === "checked_out_early",
      icon: "check-out",
    },
  ];
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
