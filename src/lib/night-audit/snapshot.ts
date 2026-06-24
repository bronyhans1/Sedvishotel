import { roundCurrency } from "@/lib/payments/currency";
import { computeRoomStats } from "@/lib/occupancy";
import { mapDbRoomToRoom } from "@/lib/rooms/mapper";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { DbPaymentTransaction } from "@/types/database";
import type { NightAuditSnapshot } from "@/types/night-audit";

function isOnBusinessDate(iso: string | null | undefined, businessDate: string): boolean {
  if (!iso) return false;
  return iso.slice(0, 10) === businessDate;
}

function aggregatePaymentTotals(
  transactions: DbPaymentTransaction[]
): Pick<
  NightAuditSnapshot,
  | "cashTotal"
  | "mobileMoneyTotal"
  | "cardTotal"
  | "bankTransferTotal"
  | "otherTotal"
  | "grossRevenue"
  | "refundTotal"
  | "netRevenue"
> {
  let cashTotal = 0;
  let mobileMoneyTotal = 0;
  let cardTotal = 0;
  let bankTransferTotal = 0;
  let otherTotal = 0;
  let grossRevenue = 0;
  let refundTotal = 0;

  for (const tx of transactions) {
    const amount = roundCurrency(Number(tx.amount));
    if (amount > 0) {
      grossRevenue = roundCurrency(grossRevenue + amount);
      switch (tx.method) {
        case "cash":
          cashTotal = roundCurrency(cashTotal + amount);
          break;
        case "mobile_money":
          mobileMoneyTotal = roundCurrency(mobileMoneyTotal + amount);
          break;
        case "card":
          cardTotal = roundCurrency(cardTotal + amount);
          break;
        case "bank_transfer":
          bankTransferTotal = roundCurrency(bankTransferTotal + amount);
          break;
        default:
          otherTotal = roundCurrency(otherTotal + amount);
          break;
      }
    } else if (amount < 0) {
      refundTotal = roundCurrency(refundTotal + Math.abs(amount));
    }
  }

  return {
    cashTotal,
    mobileMoneyTotal,
    cardTotal,
    bankTransferTotal,
    otherTotal,
    grossRevenue,
    refundTotal,
    netRevenue: roundCurrency(grossRevenue - refundTotal),
  };
}

type ReservationOperationalRow = {
  checked_in_at: string | null;
  checked_out_at: string | null;
  status: string;
};

function countOperationalMetrics(
  reservations: ReservationOperationalRow[],
  businessDate: string
): Pick<NightAuditSnapshot, "checkIns" | "checkOuts" | "activeStays"> {
  let checkIns = 0;
  let checkOuts = 0;
  let activeStays = 0;

  for (const row of reservations) {
    if (isOnBusinessDate(row.checked_in_at, businessDate)) {
      checkIns += 1;
    }
    if (isOnBusinessDate(row.checked_out_at, businessDate)) {
      checkOuts += 1;
    }
    if (row.status === "checked_in") {
      activeStays += 1;
    }
  }

  return { checkIns, checkOuts, activeStays };
}

export async function buildNightAuditSnapshot(
  businessDate: string,
  deps: {
    rooms: IRoomRepository;
    reservations: IReservationRepository;
    payments: IPaymentRepository;
  }
): Promise<NightAuditSnapshot> {
  const [roomRows, reservationRows, transactions] = await Promise.all([
    deps.rooms.getAll(false),
    deps.reservations.getAll(),
    deps.payments.getTransactionsForBusinessDate(businessDate),
  ]);

  const roomStats = computeRoomStats(roomRows.map(mapDbRoomToRoom));

  const operational = countOperationalMetrics(reservationRows, businessDate);
  const paymentTotals = aggregatePaymentTotals(transactions);

  return {
    roomsOccupied: roomStats.occupied,
    roomsAvailable: roomStats.available,
    roomsCleaning: roomStats.cleaning,
    roomsMaintenance: roomStats.maintenance,
    ...operational,
    ...paymentTotals,
  };
}
