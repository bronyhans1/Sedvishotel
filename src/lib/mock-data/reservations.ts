import { datesOverlap, nightsBetween } from "@/lib/utils";
import { getRoomTypeForRoomNumber } from "@/lib/mock-data/room-types";
import { mockRooms } from "@/lib/mock-data/rooms";
import type {
  Reservation,
  ReservationStats,
  ReservationTimelineEvent,
} from "@/types/reservation";

const TAX_RATE = 0.15;

function buildReservation(
  data: Omit<
    Reservation,
    | "roomTypeId"
    | "roomTypeName"
    | "floorLabel"
    | "roomRate"
    | "numberOfNights"
    | "subtotal"
    | "taxes"
    | "totalAmount"
    | "balance"
    | "originalCheckOutDate"
    | "actualCheckOutDate"
    | "earlyCheckOutReason"
    | "earlyCheckOutNotes"
    | "earlyCheckOutRefundAmount"
    | "lateCheckOutFee"
    | "lateCheckOutReason"
    | "lateCheckOutNotes"
    | "lateCheckOutAt"
    | "lateCheckOutComplimentary"
    | "lateCheckOutHoursLate"
    | "lateCheckOutPolicyType"
    | "stayExtensionHistory"
    | "roomMoveHistory"
    | "createdById"
  > & { roomRate?: number; createdById?: string | null }
): Reservation {
  const room = mockRooms.find((r) => r.roomNumber === data.roomNumber);
  const roomType = getRoomTypeForRoomNumber(data.roomNumber);
  const rate = data.roomRate ?? roomType?.defaultPrice ?? 0;
  const nights = nightsBetween(data.checkInDate, data.checkOutDate);
  const subtotal = rate * nights;
  const taxes = Math.round(subtotal * TAX_RATE);
  const totalAmount = subtotal + taxes;
  const balance = totalAmount - data.amountPaid;

  return {
    ...data,
    createdById: data.createdById ?? null,
    originalCheckOutDate: null,
    actualCheckOutDate: null,
    earlyCheckOutReason: null,
    earlyCheckOutNotes: null,
    earlyCheckOutRefundAmount: null,
    lateCheckOutFee: null,
    lateCheckOutReason: null,
    lateCheckOutNotes: null,
    lateCheckOutAt: null,
    lateCheckOutComplimentary: null,
    lateCheckOutHoursLate: null,
    lateCheckOutPolicyType: null,
    stayExtensionHistory: [],
    roomMoveHistory: [],
    roomRate: rate,
    roomTypeId: roomType?.id ?? "",
    roomTypeName: roomType?.name ?? "Unknown",
    floorLabel: room?.floorLabel ?? "",
    numberOfNights: nights,
    subtotal,
    taxes,
    totalAmount,
    balance,
  };
}

export const mockReservations: Reservation[] = [
  buildReservation({
    id: "res_001",
    guestId: "gst_001",
    reservationNumber: "SHMS-2026-0142",
    guestName: "Kwame Mensah",
    guestPhone: "+233 24 123 4567",
    guestEmail: "kwame.mensah@email.com",
    roomNumber: "012",
    checkInDate: "2026-06-05",
    checkOutDate: "2026-06-08",
    adults: 2,
    children: 0,
    status: "confirmed",
    bookingSource: "website",
    amountPaid: 1200,
    createdAt: "2026-05-28T10:30:00",
  }),
  buildReservation({
    id: "res_002",
    guestId: "gst_002",
    reservationNumber: "SHMS-2026-0143",
    guestName: "Ama Osei",
    guestPhone: "+233 55 987 6543",
    guestEmail: "ama.osei@email.com",
    roomNumber: "003",
    checkInDate: "2026-06-02",
    checkOutDate: "2026-06-04",
    adults: 1,
    children: 0,
    status: "checked_in",
    bookingSource: "walk_in",
    amountPaid: 575,
    createdAt: "2026-06-01T14:15:00",
  }),
  buildReservation({
    id: "res_003",
    guestId: "gst_003",
    reservationNumber: "SHMS-2026-0144",
    guestName: "James Okonkwo",
    guestPhone: "+234 803 456 7890",
    guestEmail: "j.okonkwo@corp.com",
    roomNumber: "021",
    checkInDate: "2026-06-10",
    checkOutDate: "2026-06-14",
    adults: 2,
    children: 1,
    status: "pending",
    bookingSource: "phone",
    amountPaid: 0,
    createdAt: "2026-06-02T09:00:00",
  }),
  buildReservation({
    id: "res_004",
    guestId: "gst_004",
    reservationNumber: "SHMS-2026-0145",
    guestName: "Priya Sharma",
    guestPhone: "+91 98 7654 3210",
    guestEmail: "priya.sharma@travel.in",
    roomNumber: "028",
    checkInDate: "2026-06-15",
    checkOutDate: "2026-06-18",
    adults: 2,
    children: 0,
    status: "confirmed",
    bookingSource: "travel_agent",
    amountPaid: 2070,
    createdAt: "2026-05-30T16:45:00",
  }),
  buildReservation({
    id: "res_005",
    guestId: "gst_005",
    reservationNumber: "SHMS-2026-0146",
    guestName: "Michael Chen",
    guestPhone: "+1 415 555 0198",
    guestEmail: "mchen@business.com",
    roomNumber: "015",
    checkInDate: "2026-05-28",
    checkOutDate: "2026-06-01",
    adults: 2,
    children: 0,
    status: "checked_out",
    bookingSource: "website",
    amountPaid: 1610,
    createdAt: "2026-05-20T11:20:00",
  }),
  buildReservation({
    id: "res_006",
    guestId: "gst_006",
    reservationNumber: "SHMS-2026-0147",
    guestName: "Elena Vasquez",
    guestPhone: "+34 612 345 678",
    guestEmail: "elena.v@email.es",
    roomNumber: "034",
    checkInDate: "2026-06-20",
    checkOutDate: "2026-06-25",
    adults: 2,
    children: 2,
    status: "pending",
    bookingSource: "whatsapp",
    amountPaid: 0,
    createdAt: "2026-06-02T18:30:00",
  }),
  buildReservation({
    id: "res_007",
    guestId: "gst_007",
    reservationNumber: "SHMS-2026-0148",
    guestName: "David Thompson",
    guestPhone: "+44 7700 900123",
    guestEmail: "d.thompson@uk.co",
    roomNumber: "007",
    checkInDate: "2026-06-03",
    checkOutDate: "2026-06-05",
    adults: 1,
    children: 0,
    status: "cancelled",
    bookingSource: "website",
    amountPaid: 0,
    createdAt: "2026-05-25T08:00:00",
  }),
  buildReservation({
    id: "res_008",
    guestId: "gst_008",
    reservationNumber: "SHMS-2026-0149",
    guestName: "Fatima Al-Rashid",
    guestPhone: "+971 50 123 4567",
    guestEmail: "fatima.ar@email.ae",
    roomNumber: "030",
    checkInDate: "2026-06-08",
    checkOutDate: "2026-06-12",
    adults: 2,
    children: 0,
    status: "confirmed",
    bookingSource: "travel_agent",
    amountPaid: 2760,
    createdAt: "2026-05-29T13:10:00",
  }),
  buildReservation({
    id: "res_009",
    guestId: "gst_009",
    reservationNumber: "SHMS-2026-0150",
    guestName: "Robert Kim",
    guestPhone: "+82 10 9876 5432",
    guestEmail: "rkim@email.kr",
    roomNumber: "019",
    checkInDate: "2026-05-30",
    checkOutDate: "2026-06-02",
    adults: 2,
    children: 0,
    status: "no_show",
    bookingSource: "website",
    amountPaid: 450,
    createdAt: "2026-05-22T07:45:00",
  }),
  buildReservation({
    id: "res_010",
    guestId: "gst_010",
    reservationNumber: "SHMS-2026-0151",
    guestName: "Sarah Mitchell",
    guestPhone: "+233 20 555 1234",
    guestEmail: "sarah.m@email.com",
    roomNumber: "005",
    checkInDate: "2026-06-12",
    checkOutDate: "2026-06-15",
    adults: 1,
    children: 0,
    status: "confirmed",
    bookingSource: "phone",
    amountPaid: 862,
    createdAt: "2026-06-01T10:00:00",
  }),
  buildReservation({
    id: "res_011",
    guestId: "gst_011",
    reservationNumber: "SHMS-2026-0152",
    guestName: "Thomas Berg",
    guestPhone: "+49 170 1234567",
    guestEmail: "t.berg@email.de",
    roomNumber: "024",
    checkInDate: "2026-06-06",
    checkOutDate: "2026-06-09",
    adults: 2,
    children: 0,
    status: "checked_in",
    bookingSource: "walk_in",
    amountPaid: 1552,
    createdAt: "2026-06-05T15:30:00",
  }),
  buildReservation({
    id: "res_012",
    guestId: "gst_012",
    reservationNumber: "SHMS-2026-0153",
    guestName: "Grace Adjei",
    guestPhone: "+233 27 888 9999",
    guestEmail: "grace.adjei@email.com",
    roomNumber: "033",
    checkInDate: "2026-06-18",
    checkOutDate: "2026-06-22",
    adults: 2,
    children: 2,
    status: "pending",
    bookingSource: "whatsapp",
    amountPaid: 0,
    createdAt: "2026-06-02T12:00:00",
  }),
];

const BLOCKING_STATUSES = new Set([
  "pending",
  "confirmed",
  "checked_in",
]);

export function getReservationById(id: string): Reservation | undefined {
  return mockReservations.find(
    (r) => r.id === id || r.reservationNumber === id
  );
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
      if (r.status === "checked_out") acc.checkedOut += 1;
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

export const mockReservationStats = computeReservationStats(mockReservations);

export function getBookedRoomNumbers(
  checkIn: string,
  checkOut: string,
  excludeId?: string
): Set<string> {
  const booked = new Set<string>();
  for (const res of mockReservations) {
    if (excludeId && res.id === excludeId) continue;
    if (!BLOCKING_STATUSES.has(res.status)) continue;
    if (datesOverlap(checkIn, checkOut, res.checkInDate, res.checkOutDate)) {
      booked.add(res.roomNumber);
    }
  }
  return booked;
}

export function getAvailableRoomsForDates(
  checkIn: string,
  checkOut: string
): typeof mockRooms {
  if (!checkIn || !checkOut || checkOut <= checkIn) return [];
  const booked = getBookedRoomNumbers(checkIn, checkOut);
  return mockRooms.filter(
    (r) =>
      !booked.has(r.roomNumber) &&
      r.status !== "maintenance" &&
      r.status !== "cleaning"
  );
}

export function getReservationTimeline(
  reservation: Reservation
): ReservationTimelineEvent[] {
  const events: ReservationTimelineEvent[] = [
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
      completed: ["confirmed", "checked_in", "checked_out"].includes(
        reservation.status
      ),
      icon: "confirmed",
    },
    {
      id: "4",
      title: "Check-In",
      description: `Room ${reservation.roomNumber} · ${reservation.checkInDate}`,
      timestamp: reservation.checkInDate,
      completed: ["checked_in", "checked_out"].includes(reservation.status),
      icon: "check-in",
    },
    {
      id: "5",
      title: "Check-Out",
      description: `Scheduled ${reservation.checkOutDate}`,
      timestamp: reservation.checkOutDate,
      completed: reservation.status === "checked_out",
      icon: "check-out",
    },
  ];
  return events;
}
