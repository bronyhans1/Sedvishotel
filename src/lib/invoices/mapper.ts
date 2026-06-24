import { resolveFloorLabel } from "@/lib/rooms/mapper";
import type {
  DbInvoiceStatus,
  DbInvoiceWithRelations,
  InvoiceLineItem,
} from "@/types/database";
import type { Invoice, InvoiceStatus } from "@/types/invoice";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function resolveInvoiceStatus(
  balance: number,
  amountPaid: number,
  status: DbInvoiceStatus
): InvoiceStatus {
  if (status === "void" || status === "draft") return "draft";
  if (balance <= 0) return "paid";
  if (amountPaid > 0) return "partial";
  return "outstanding";
}

export function mapDbInvoiceToInvoice(row: DbInvoiceWithRelations): Invoice {
  const reservation = row.reservation;
  const room = reservation.room;
  const roomType = reservation.room_type;
  const balance = Number(row.balance);
  const amountPaid = Number(row.amount_paid);

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    guestId: row.guest_id,
    guestName: row.guest.full_name,
    guestEmail: row.guest.email ?? "",
    guestPhone: row.guest.phone ?? "",
    guestAddress: row.guest.address ?? "—",
    reservationId: row.reservation_id,
    reservationNumber: reservation.reservation_number,
    roomNumber: room.room_number,
    roomTypeName: roomType.name,
    floorLabel: resolveFloorLabel(room),
    invoiceDate: row.invoice_date,
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    numberOfNights: row.number_of_nights,
    roomRate: Number(row.room_rate),
    roomCharges: Number(row.room_charges),
    taxes: Number(row.taxes),
    additionalCharges:
      Number(row.service_charge) + Number(row.additional_charges),
    discounts: Number(row.discounts),
    totalAmount: Number(row.total_amount),
    amountPaid,
    balance,
    status: resolveInvoiceStatus(balance, amountPaid, row.status),
  };
}

export function buildInvoiceLineItems(input: {
  numberOfNights: number;
  roomRate: number;
  roomCharges: number;
  taxes: number;
  serviceCharge: number;
  additionalCharges: number;
  discounts: number;
  amountPaid: number;
}): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [
    {
      description: `Room rate × ${input.numberOfNights} nights`,
      quantity: input.numberOfNights,
      unit_price: input.roomRate,
      amount: input.roomCharges,
    },
    {
      description: "Taxes",
      quantity: 1,
      unit_price: input.taxes,
      amount: input.taxes,
    },
  ];

  if (input.serviceCharge > 0) {
    items.push({
      description: "Service charge",
      quantity: 1,
      unit_price: input.serviceCharge,
      amount: input.serviceCharge,
    });
  }

  if (input.additionalCharges > 0) {
    items.push({
      description: "Additional charges",
      quantity: 1,
      unit_price: input.additionalCharges,
      amount: input.additionalCharges,
    });
  }

  if (input.discounts > 0) {
    items.push({
      description: "Discounts",
      quantity: 1,
      unit_price: -input.discounts,
      amount: -input.discounts,
    });
  }

  if (input.amountPaid > 0) {
    items.push({
      description: "Payments received",
      quantity: 1,
      unit_price: -input.amountPaid,
      amount: -input.amountPaid,
    });
  }

  return items;
}
