import { mockGuests } from "@/lib/mock-data/guests";
import { mockReservations } from "@/lib/mock-data/reservations";
import type { Invoice, InvoiceStats } from "@/types/invoice";

function buildInvoice(res: (typeof mockReservations)[0]): Invoice {
  const guest = mockGuests.find(
    (g) => g.email.toLowerCase() === res.guestEmail.toLowerCase()
  );
  const balance = res.totalAmount - res.amountPaid;
  let status: Invoice["status"] = "outstanding";
  if (balance <= 0) status = "paid";
  else if (res.amountPaid > 0) status = "partial";

  return {
    id: `inv_${res.id}`,
    invoiceNumber: `INV-2026-${res.reservationNumber.slice(-4)}`,
    guestId: guest?.id ?? "",
    guestName: res.guestName,
    guestEmail: res.guestEmail,
    guestPhone: res.guestPhone,
    guestAddress: guest?.address ?? "—",
    reservationId: res.id,
    reservationNumber: res.reservationNumber,
    roomNumber: res.roomNumber,
    roomTypeName: res.roomTypeName,
    floorLabel: res.floorLabel,
    invoiceDate: res.createdAt.slice(0, 10),
    checkInDate: res.checkInDate,
    checkOutDate: res.checkOutDate,
    numberOfNights: res.numberOfNights,
    roomRate: res.roomRate,
    roomCharges: res.subtotal,
    taxes: res.taxes,
    additionalCharges: 0,
    discounts: 0,
    totalAmount: res.totalAmount,
    amountPaid: res.amountPaid,
    balance,
    status,
  };
}

export const mockInvoices: Invoice[] = mockReservations
  .filter((r) => r.status !== "cancelled")
  .map(buildInvoice);

export function getInvoiceById(id: string): Invoice | undefined {
  return mockInvoices.find(
    (i) => i.id === id || i.invoiceNumber === id
  );
}

export function computeInvoiceStats(invoices: Invoice[]): InvoiceStats {
  const paid = invoices.filter((i) => i.status === "paid");
  const outstanding = invoices.filter(
    (i) => i.status === "outstanding" || i.status === "partial"
  );
  const avg =
    invoices.length > 0
      ? Math.round(
          invoices.reduce((s, i) => s + i.totalAmount, 0) / invoices.length
        )
      : 0;
  return {
    generated: invoices.length,
    paid: paid.length,
    outstanding: outstanding.length,
    averageValue: avg,
  };
}

export const mockInvoiceStats = computeInvoiceStats(mockInvoices);
