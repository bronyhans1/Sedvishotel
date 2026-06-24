import { getPaymentAccess } from "@/lib/auth/payment-access";
import { mapDbPaymentToPayment } from "@/lib/payments/mapper";
import {
  aggregatePaymentMethod,
  countPositiveTransactions,
  formatMethodsUsed,
  getMethodsUsed,
} from "@/lib/payments/method-aggregation";
import {
  computeOutstandingBalance,
  exceedsOutstandingBalance,
  exceedsRefundableAmount,
  OVERPAYMENT_ERROR,
  OVER_REFUND_ERROR,
  roundCurrency,
} from "@/lib/payments/currency";
import {
  buildRefundDescription,
  computeTransactionTotals,
  resolvePaymentStatusFromTotals,
} from "@/lib/payments/totals";
import { resolveOutstandingForPayment } from "@/lib/payments/outstanding";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IInvoiceRepository } from "@/repositories/invoice.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbPaymentTransaction, DbReservationWithRelations } from "@/types/database";
import type { Payment, PaymentFormValues, RefundFormValues } from "@/types/payment";

export interface UpdatePaymentInput {
  method?: PaymentFormValues["method"];
  reference?: string;
  notes?: string;
}

export interface IPaymentService {
  getAll(ctx: ServiceContext, session: AuthSession): Promise<Payment[]>;
  getById(
    ctx: ServiceContext,
    session: AuthSession,
    paymentId: string
  ): Promise<Payment | null>;
  create(
    ctx: ServiceContext,
    session: AuthSession,
    values: PaymentFormValues
  ): Promise<Payment>;
  update(
    ctx: ServiceContext,
    session: AuthSession,
    paymentId: string,
    input: UpdatePaymentInput
  ): Promise<Payment>;
  refund(
    ctx: ServiceContext,
    session: AuthSession,
    paymentId: string,
    values: RefundFormValues
  ): Promise<Payment>;
}

function resolveInvoiceStatus(
  totalAmount: number,
  amountPaid: number
): "paid" | "partial" | "outstanding" {
  const balance = Math.max(0, totalAmount - amountPaid);
  if (balance <= 0) return "paid";
  if (amountPaid > 0) return "partial";
  return "outstanding";
}

export class PaymentService implements IPaymentService {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly reservations: IReservationRepository,
    private readonly invoices: IInvoiceRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "refund"
  ): void {
    const access = getPaymentAccess(session);
    const allowed =
      (action === "view" && access.canView) ||
      (action === "create" && access.canRecord) ||
      (action === "edit" && access.canUpdate) ||
      (action === "refund" && access.canRefund);

    if (!allowed) {
      throw new ServiceError(
        `Forbidden: missing permission payments.${action}`,
        "FORBIDDEN",
        403
      );
    }
  }

  private async log(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      action: string;
      actionCode: string;
      paymentId: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: "payments",
      entityType: "payment",
      entityId: input.paymentId,
      metadata: input.metadata,
    });
  }

  private async mapPayment(paymentId: string): Promise<Payment | null> {
    const row = await this.payments.getById(paymentId);
    if (!row) return null;
    const transactions = await this.payments.getTransactions(paymentId);
    return mapDbPaymentToPayment(row, transactions);
  }

  private async logReceiptGenerated(
    ctx: ServiceContext,
    session: AuthSession,
    paymentId: string,
    transaction: DbPaymentTransaction,
    transactionNumber: number
  ): Promise<void> {
    if (!transaction.receipt_number) return;

    await this.log(ctx, session, {
      action: "Receipt Generated",
      actionCode: ActivityActionCodes.RECEIPT_GENERATED,
      paymentId,
      metadata: {
        receipt_number: transaction.receipt_number,
        transaction_number: transactionNumber,
        amount: Number(transaction.amount),
        method: transaction.method,
      },
    });
  }

  private async syncInvoiceFromReservation(
    reservation: DbReservationWithRelations
  ): Promise<void> {
    const invoice = await this.invoices.getByReservationId(reservation.id);
    if (!invoice) return;

    const amountPaid = Number(reservation.amount_paid);
    const totalAmount = Number(invoice.total_amount);
    const balance = Math.max(0, totalAmount - amountPaid);

    await this.invoices.update(invoice.id, {
      amount_paid: amountPaid,
      balance,
      status: resolveInvoiceStatus(totalAmount, amountPaid),
    });
  }

  async getAll(ctx: ServiceContext, session: AuthSession): Promise<Payment[]> {
    this.require(session, "view");
    const rows = await this.payments.getAll();
    const txByPayment = await this.payments.getTransactionsForIds(
      rows.map((row) => row.id)
    );
    return rows.map((row) =>
      mapDbPaymentToPayment(row, txByPayment.get(row.id) ?? [])
    );
  }

  async getById(
    _ctx: ServiceContext,
    session: AuthSession,
    paymentId: string
  ): Promise<Payment | null> {
    this.require(session, "view");
    const row = await this.payments.getById(paymentId);
    if (!row) return null;
    const transactions = await this.payments.getTransactions(row.id);
    return mapDbPaymentToPayment(row, transactions);
  }

  async create(
    ctx: ServiceContext,
    session: AuthSession,
    values: PaymentFormValues
  ): Promise<Payment> {
    this.require(session, "create");

    if (!values.reservationId) {
      throw new ServiceError("Reservation is required.", "VALIDATION", 400);
    }
    if (!values.guestId) {
      throw new ServiceError("Guest is required.", "VALIDATION", 400);
    }
    if (!values.amount || roundCurrency(values.amount) <= 0) {
      throw new ServiceError("Amount must be greater than zero.", "VALIDATION", 400);
    }

    const reservation = await this.reservations.getById(values.reservationId);
    if (!reservation) {
      throw new ServiceError("Reservation not found.", "NOT_FOUND", 404);
    }
    if (reservation.guest_id !== values.guestId) {
      throw new ServiceError("Guest does not match reservation.", "VALIDATION", 400);
    }
    if (reservation.status === "cancelled") {
      throw new ServiceError(
        "Cannot record payment for a cancelled reservation.",
        "VALIDATION",
        400
      );
    }

    const requestedAmount = roundCurrency(values.amount);
    const now = new Date().toISOString();
    const transactionDescription =
      values.notes.trim() || "Payment recorded";

    const existingPayment = await this.payments.getByReservationId(
      reservation.id
    );
    const existingTransactions = existingPayment
      ? await this.payments.getTransactions(existingPayment.id)
      : [];

    const outstandingContext = resolveOutstandingForPayment({
      reservationTotalDue: Number(reservation.total_amount),
      reservationAmountPaid: Number(reservation.amount_paid),
      existingPayment,
      transactions: existingTransactions,
    });

    const { totalDue, outstandingBalance } = outstandingContext;

    if (exceedsOutstandingBalance(requestedAmount, outstandingBalance)) {
      throw new ServiceError(OVERPAYMENT_ERROR, "VALIDATION", 400);
    }

    if (existingPayment) {
      const existingTotals = computeTransactionTotals(existingTransactions);
      const currentBalance = roundCurrency(Number(existingPayment.balance_after));

      if (
        existingTotals.totalRefunded > 0 &&
        existingTotals.totalRefunded >= existingTotals.totalPaid &&
        existingTotals.totalPaid > 0
      ) {
        throw new ServiceError(
          "This payment has been fully refunded.",
          "VALIDATION",
          400
        );
      }

      if (currentBalance <= 0 && existingPayment.status === "paid") {
        throw new ServiceError(
          "This reservation is already fully paid.",
          "VALIDATION",
          400
        );
      }

      const createdTx = await this.payments.addTransaction(existingPayment.id, {
        description: transactionDescription,
        amount: requestedAmount,
        method: values.method,
        transacted_at: now,
      });

      const transactions = await this.payments.getTransactions(
        existingPayment.id
      );
      const totals = computeTransactionTotals(transactions);
      const settledTotalDue = roundCurrency(Number(existingPayment.total_due));
      const settledNetPaid = totals.netPaid;
      const balance = computeOutstandingBalance(settledTotalDue, settledNetPaid);
      const status = resolvePaymentStatusFromTotals(settledTotalDue, totals);
      const aggregatedMethod = aggregatePaymentMethod(transactions);
      const methodsUsed = getMethodsUsed(transactions);
      const transactionNumber = countPositiveTransactions(transactions);

      await this.payments.update(existingPayment.id, {
        amount: settledNetPaid,
        balance_after: balance,
        status,
        method: aggregatedMethod,
        payment_date: now,
        notes: values.notes.trim() || existingPayment.notes,
      });

      await this.reservations.update(reservation.id, {
        amount_paid: settledNetPaid,
        balance,
      });

      const updatedReservation = await this.reservations.getById(
        reservation.id
      );
      if (updatedReservation) {
        await this.syncInvoiceFromReservation(updatedReservation);
      }

      await this.logReceiptGenerated(
        ctx,
        session,
        existingPayment.id,
        createdTx,
        transactionNumber
      );

      await this.log(ctx, session, {
        action: "Payment continued",
        actionCode: ActivityActionCodes.PAYMENT_RECORDED,
        paymentId: existingPayment.id,
        metadata: {
          reservationId: reservation.id,
          transaction_number: transactionNumber,
          amount: requestedAmount,
          method: values.method,
          total_paid: totals.totalPaid,
          balance_remaining: balance,
          methods_used: formatMethodsUsed(methodsUsed),
          reference: existingPayment.reference,
          receipt_number: createdTx.receipt_number,
          continued: true,
        },
      });

      const payment = await this.mapPayment(existingPayment.id);
      if (!payment) {
        throw new ServiceError(
          "Payment not found after update.",
          "INTERNAL",
          500
        );
      }
      return payment;
    }

    if (outstandingBalance <= 0) {
      throw new ServiceError(
        "This reservation has no outstanding balance.",
        "VALIDATION",
        400
      );
    }

    const newNetPaid = roundCurrency(
      outstandingContext.previousNetPaid + requestedAmount
    );
    const balance = computeOutstandingBalance(totalDue, newNetPaid);

    const reference =
      values.referenceNumber.trim() || (await this.payments.getNextReference());
    const totals = computeTransactionTotals([{ amount: requestedAmount }]);
    const status = resolvePaymentStatusFromTotals(totalDue, totals);

    const { payment: row, transaction: createdTx } = await this.payments.create(
      {
        reference,
        reservation_id: reservation.id,
        guest_id: values.guestId,
        method: values.method,
        amount: totals.netPaid,
        total_due: totalDue,
        balance_after: balance,
        status,
        payment_date: now,
        notes: values.notes.trim() || null,
        recorded_by: ctx.userId,
      },
      {
        description: transactionDescription,
        amount: requestedAmount,
        method: values.method,
        transacted_at: now,
      }
    );

    await this.reservations.update(reservation.id, {
      amount_paid: newNetPaid,
      balance,
    });

    const updatedReservation = await this.reservations.getById(reservation.id);
    if (updatedReservation) {
      await this.syncInvoiceFromReservation(updatedReservation);
    }

    await this.logReceiptGenerated(ctx, session, row.id, createdTx, 1);

    await this.log(ctx, session, {
      action: "Payment recorded",
      actionCode: ActivityActionCodes.PAYMENT_RECORDED,
      paymentId: row.id,
      metadata: {
        reservationId: reservation.id,
        transaction_number: 1,
        amount: requestedAmount,
        method: values.method,
        total_paid: requestedAmount,
        balance_remaining: balance,
        methods_used: formatMethodsUsed(getMethodsUsed([{
          method: values.method,
          amount: requestedAmount,
        }])),
        reference,
        receipt_number: createdTx.receipt_number,
      },
    });

    const payment = await this.mapPayment(row.id);
    if (!payment) {
      throw new ServiceError("Payment not found after create.", "INTERNAL", 500);
    }
    return payment;
  }

  async update(
    ctx: ServiceContext,
    session: AuthSession,
    paymentId: string,
    input: UpdatePaymentInput
  ): Promise<Payment> {
    this.require(session, "edit");

    const existing = await this.payments.getById(paymentId);
    if (!existing) {
      throw new ServiceError("Payment not found.", "NOT_FOUND", 404);
    }

    const patch: Parameters<IPaymentRepository["update"]>[1] = {};
    if (input.method) patch.method = input.method;
    if (input.reference?.trim()) patch.reference = input.reference.trim();
    if (input.notes !== undefined) patch.notes = input.notes.trim() || null;

    if (Object.keys(patch).length === 0) {
      throw new ServiceError("No changes provided.", "VALIDATION", 400);
    }

    await this.payments.update(existing.id, patch);

    await this.log(ctx, session, {
      action: "Payment updated",
      actionCode: ActivityActionCodes.PAYMENT_UPDATED,
      paymentId: existing.id,
      metadata: { ...patch },
    });

    const payment = await this.mapPayment(existing.id);
    if (!payment) {
      throw new ServiceError("Payment not found after update.", "INTERNAL", 500);
    }
    return payment;
  }

  async refund(
    ctx: ServiceContext,
    session: AuthSession,
    paymentId: string,
    values: RefundFormValues
  ): Promise<Payment> {
    this.require(session, "refund");

    if (!values.amount || roundCurrency(values.amount) <= 0) {
      throw new ServiceError(
        "Refund amount must be greater than zero.",
        "VALIDATION",
        400
      );
    }
    if (!values.reason.trim()) {
      throw new ServiceError("Refund reason is required.", "VALIDATION", 400);
    }

    const existing = await this.payments.getById(paymentId);
    if (!existing) {
      throw new ServiceError("Payment not found.", "NOT_FOUND", 404);
    }

    const reservation = await this.reservations.getById(existing.reservation_id);
    if (!reservation) {
      throw new ServiceError("Reservation not found.", "NOT_FOUND", 404);
    }

    const transactions = await this.payments.getTransactions(existing.id);
    const totals = computeTransactionTotals(transactions);

    const refundAmount = roundCurrency(values.amount);

    if (totals.maxRefundable <= 0) {
      throw new ServiceError(
        "No refundable amount remains on this payment.",
        "VALIDATION",
        400
      );
    }

    if (exceedsRefundableAmount(refundAmount, totals.maxRefundable)) {
      throw new ServiceError(OVER_REFUND_ERROR, "VALIDATION", 400);
    }

    const totalDue = roundCurrency(Number(reservation.total_amount));
    const now = new Date().toISOString();

    await this.payments.addTransaction(existing.id, {
      description: buildRefundDescription(values.reason, values.notes),
      amount: -refundAmount,
      method: values.method,
      transacted_at: now,
    });

    const updatedTransactions = await this.payments.getTransactions(existing.id);
    const updatedTotals = computeTransactionTotals(updatedTransactions);
    const newNetPaid = updatedTotals.netPaid;
    const balance = computeOutstandingBalance(totalDue, newNetPaid);
    const status = resolvePaymentStatusFromTotals(totalDue, updatedTotals);
    const aggregatedMethod = aggregatePaymentMethod(updatedTransactions);
    const refundCount = updatedTransactions.filter(
      (tx) => Number(tx.amount) < 0
    ).length;

    await this.payments.update(existing.id, {
      amount: newNetPaid,
      balance_after: balance,
      status,
      method: aggregatedMethod,
      payment_date: now,
    });

    await this.reservations.update(reservation.id, {
      amount_paid: newNetPaid,
      balance,
    });

    const updatedReservation = await this.reservations.getById(reservation.id);
    if (updatedReservation) {
      await this.syncInvoiceFromReservation(updatedReservation);
    }

    await this.log(ctx, session, {
      action: "Payment refunded",
      actionCode: ActivityActionCodes.PAYMENT_REFUNDED,
      paymentId: existing.id,
      metadata: {
        reservationId: reservation.id,
        refund_amount: refundAmount,
        method: values.method,
        reason: values.reason.trim(),
        remaining_balance: balance,
        total_refunded: updatedTotals.totalRefunded,
        net_paid: newNetPaid,
        refund_number: refundCount,
      },
    });

    const payment = await this.mapPayment(existing.id);
    if (!payment) {
      throw new ServiceError("Payment not found after refund.", "INTERNAL", 500);
    }
    return payment;
  }
}
