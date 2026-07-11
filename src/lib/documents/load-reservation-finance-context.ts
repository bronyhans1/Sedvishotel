import type { AuthSession } from "@/services/auth.service";
import type { ServiceContext } from "@/services/types";
import { getInvoiceAccess } from "@/lib/auth/invoice-access";
import { getPaymentAccess } from "@/lib/auth/payment-access";
import { loadHotelDocumentSettings } from "@/lib/documents/load-document-settings";
import { getInvoiceService } from "@/lib/invoices/get-invoice-service";
import { getPaymentService } from "@/lib/payments/get-payment-service";
import type { ReceiptBranding } from "@/lib/receipt/receipt-core";
import type { InvoiceAccess } from "@/lib/auth/invoice-access.types";
import type { PaymentAccess } from "@/lib/auth/payment-access.types";
import type { Invoice } from "@/types/invoice";
import type { Payment } from "@/types/payment";

export type ReservationFinanceContext = {
  invoice: Invoice | null;
  payment: Payment | null;
  invoiceAccess: InvoiceAccess;
  paymentAccess: PaymentAccess;
  receiptBranding: ReceiptBranding;
};

export async function loadReservationFinanceContext(
  ctx: ServiceContext,
  session: AuthSession,
  reservationId: string
): Promise<ReservationFinanceContext> {
  const invoiceAccess = getInvoiceAccess(session);
  const paymentAccess = getPaymentAccess(session);
  const [documentSettings, invoiceService, paymentService] = await Promise.all([
    loadHotelDocumentSettings(ctx, session),
    getInvoiceService(),
    getPaymentService(),
  ]);

  const [invoice, payment] = await Promise.all([
    invoiceAccess.canView
      ? invoiceService.getByReservationId(ctx, session, reservationId)
      : Promise.resolve(null),
    paymentAccess.canView
      ? paymentService.getByReservationId(ctx, session, reservationId)
      : Promise.resolve(null),
  ]);

  return {
    invoice,
    payment,
    invoiceAccess,
    paymentAccess,
    receiptBranding: documentSettings.receiptBranding,
  };
}
