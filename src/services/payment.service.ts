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
import {
  buildReceiptPrintHistory,
  buildReceiptPrintHistoryForTransaction,
  type ReceiptPrintHistoryEntry,
} from "@/lib/payments/receipt-print-history";
import { resolveOutstandingForPayment } from "@/lib/payments/outstanding";
import {
  PaymentAtomicError,
} from "@/lib/payments/atomic-commit";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IInvoiceRepository } from "@/repositories/invoice.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { ISettingsRepository } from "@/repositories/settings.repository";
import { resolvePaymentTransactionVat, resolveEffectiveTotalDue, toPaymentTransactionVatFields } from "@/lib/payments/resolve-vat";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbPaymentTransaction } from "@/types/database";
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
  getByReservationId(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<Payment | null>;
  getReceiptPrintHistory(
    ctx: ServiceContext,
    session: AuthSession,
    paymentId: string
  ): Promise<{
    all: ReceiptPrintHistoryEntry[];
    byTransaction: Record<string, ReceiptPrintHistoryEntry[]>;
  }>;
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
  recordReceiptPrint(
    ctx: ServiceContext,
    session: AuthSession,
    transactionId: string
  ): Promise<{ printCount: number; receiptNumber: string }>;
}

export class PaymentService implements IPaymentService {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly reservations: IReservationRepository,
    private readonly invoices: IInvoiceRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly settings: ISettingsRepository,
    private readonly folios?: import("@/services/guest-folio.service").IGuestFolioService
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

  private async getDefaultVatRate(): Promise<number> {
    const taxSettings = await this.settings.getTaxAndCharges();
    return taxSettings?.taxRate ?? 0.15;
  }

  private async logVatOverride(
    ctx: ServiceContext,
    session: AuthSession,
    paymentId: string,
    vat: ReturnType<typeof resolvePaymentTransactionVat>
  ): Promise<void> {
    if (!vat.vatOverridden) return;

    await this.log(ctx, session, {
      action: "VAT overridden on payment",
      actionCode: ActivityActionCodes.PAYMENT_VAT_OVERRIDDEN,
      paymentId,
      metadata: {
        vat_applied: vat.vat_applied,
        vat_rate: vat.vat_rate,
        vat_amount: vat.vat_amount,
        exemption_reason: vat.vat_exemption_reason,
        notes: vat.vat_exemption_notes,
        staff_member: session.fullName,
        timestamp: vat.vat_overridden_at,
      },
    });
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

  async getByReservationId(
    _ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<Payment | null> {
    this.require(session, "view");
    const row = await this.payments.getByReservationId(reservationId);
    if (!row) return null;
    const transactions = await this.payments.getTransactions(row.id);
    return mapDbPaymentToPayment(row, transactions);
  }

  async getReceiptPrintHistory(
    _ctx: ServiceContext,
    session: AuthSession,
    paymentId: string
  ): Promise<{
    all: ReceiptPrintHistoryEntry[];
    byTransaction: Record<string, ReceiptPrintHistoryEntry[]>;
  }> {
    this.require(session, "view");
    const logs = await this.activityLogs.findReceiptPrintEvents(paymentId);
    const all = buildReceiptPrintHistory(logs);
    const byTransaction: Record<string, ReceiptPrintHistoryEntry[]> = {};

    for (const entry of logs) {
      const transactionId =
        typeof entry.metadata.transaction_id === "string"
          ? entry.metadata.transaction_id
          : null;
      if (!transactionId) continue;
      byTransaction[transactionId] = buildReceiptPrintHistoryForTransaction(
        logs,
        transactionId
      );
    }

    return { all, byTransaction };
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
    if (!values.idempotencyKey?.trim()) {
      throw new ServiceError(
        "Payment idempotency key is required.",
        "VALIDATION",
        400
      );
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
    const defaultVatRate = await this.getDefaultVatRate();
    const chargeBase = roundCurrency(
      Number(reservation.subtotal) + Number(reservation.late_checkout_fee ?? 0)
    );
    const vatFields = resolvePaymentTransactionVat(
      session,
      ctx,
      values,
      defaultVatRate,
      chargeBase,
      now
    );
    const transactionVatFields = toPaymentTransactionVatFields(vatFields);
    const transactionDescription =
      values.notes.trim() || "Payment recorded";

    const existingPayment = await this.payments.getByReservationId(
      reservation.id
    );
    const existingTransactions = existingPayment
      ? await this.payments.getTransactions(existingPayment.id)
      : [];

    const folioSettlement = this.folios
      ? await this.folios.getAuthoritativeSettlement(reservation.id)
      : null;

    const outstandingContext = resolveOutstandingForPayment({
      reservationTotalDue: Number(reservation.total_amount),
      reservationAmountPaid: Number(reservation.amount_paid),
      existingPayment,
      transactions: existingTransactions,
    });

    const effectiveTotalDue = folioSettlement
      ? folioSettlement.totalAmount
      : existingPayment && existingTransactions.length > 0
        ? outstandingContext.totalDue
        : resolveEffectiveTotalDue(
            reservation,
            vatFields.vat_applied ?? true,
            vatFields.vat_rate ?? defaultVatRate
          );

    const previousNetPaid = folioSettlement
      ? folioSettlement.amountPaid
      : outstandingContext.previousNetPaid;

    const outstandingBalance = folioSettlement
      ? roundCurrency(Math.max(0, folioSettlement.outstandingBalance))
      : roundCurrency(Math.max(0, effectiveTotalDue - previousNetPaid));

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

      if (currentBalance <= 0 && existingPayment.status === "paid" && !folioSettlement) {
        throw new ServiceError(
          "This reservation is already fully paid.",
          "VALIDATION",
          400
        );
      }

      const projectedTotals = computeTransactionTotals([
        ...existingTransactions,
        { amount: requestedAmount },
      ]);
      const settledTotalDue = folioSettlement
        ? folioSettlement.totalAmount
        : roundCurrency(Number(existingPayment.total_due));
      const settledNetPaid = folioSettlement
        ? roundCurrency(folioSettlement.amountPaid + requestedAmount)
        : projectedTotals.netPaid;
      const balance = computeOutstandingBalance(settledTotalDue, settledNetPaid);
      const status = resolvePaymentStatusFromTotals(settledTotalDue, projectedTotals);
      const aggregatedMethod = aggregatePaymentMethod([
        ...existingTransactions,
        { amount: requestedAmount, method: values.method },
      ]);
      const methodsUsed = getMethodsUsed([
        ...existingTransactions,
        { amount: requestedAmount, method: values.method },
      ]);
      const transactionNumber = countPositiveTransactions(existingTransactions) + 1;

      const commitResult = await this.payments.commitPaymentAtomically({
        idempotencyKey: values.idempotencyKey,
        mode: "continue",
        reservationId: reservation.id,
        guestId: values.guestId,
        paymentId: existingPayment.id,
        recordedBy: ctx.userId,
        paymentMethod: aggregatedMethod,
        paymentAmount: settledNetPaid,
        totalDue: settledTotalDue,
        balanceAfter: balance,
        paymentStatus: status,
        paymentDate: now,
        paymentNotes: values.notes.trim() || existingPayment.notes,
        transaction: {
          description: transactionDescription,
          amount: requestedAmount,
          method: values.method,
          transacted_at: now,
          ...transactionVatFields,
        },
        reservationAmountPaid: settledNetPaid,
        reservationBalance: balance,
        postFolioCredit:
          Boolean(this.folios) && reservation.status === "checked_in",
        folioCreditAmount: requestedAmount,
        folioCreditReference: null,
      });

      if (!commitResult.idempotentReplay) {
        const createdTx = await this.payments
          .getTransactions(existingPayment.id)
          .then((txs) => txs.find((tx) => tx.id === commitResult.transactionId));

        if (createdTx?.receipt_number) {
          await this.logReceiptGenerated(
            ctx,
            session,
            existingPayment.id,
            createdTx,
            transactionNumber
          );
        }

        await this.log(ctx, session, {
          action: "Payment continued",
          actionCode: ActivityActionCodes.PAYMENT_RECORDED,
          paymentId: existingPayment.id,
          metadata: {
            reservationId: reservation.id,
            transaction_number: transactionNumber,
            amount: requestedAmount,
            method: values.method,
            total_paid: projectedTotals.totalPaid,
            balance_remaining: balance,
            methods_used: formatMethodsUsed(methodsUsed),
            reference: existingPayment.reference,
            receipt_number: commitResult.receiptNumber,
            continued: true,
            vat_applied: vatFields.vat_applied,
            vat_rate: vatFields.vat_rate,
            vat_amount: vatFields.vat_amount,
          },
        });

        await this.logVatOverride(ctx, session, existingPayment.id, vatFields);

        if (folioSettlement && this.folios) {
          await this.folios.syncReservationSettlement(reservation.id);
        }
      }

      const payment = await this.mapPayment(existingPayment.id);
      if (!payment) {
        throw new PaymentAtomicError();
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

    const newNetPaid = folioSettlement
      ? roundCurrency(folioSettlement.amountPaid + requestedAmount)
      : roundCurrency(outstandingContext.previousNetPaid + requestedAmount);
    const balance = computeOutstandingBalance(effectiveTotalDue, newNetPaid);

    const reference = values.referenceNumber.trim() || undefined;
    const totals = computeTransactionTotals([{ amount: requestedAmount }]);
    const status = resolvePaymentStatusFromTotals(effectiveTotalDue, totals);

    const reservationTaxes = vatFields.vat_applied
      ? roundCurrency(chargeBase * (vatFields.vat_rate ?? defaultVatRate))
      : 0;

    const commitResult = await this.payments.commitPaymentAtomically({
      idempotencyKey: values.idempotencyKey,
      mode: "new",
      reservationId: reservation.id,
      guestId: values.guestId,
      reference,
      recordedBy: ctx.userId,
      paymentMethod: values.method,
      paymentAmount: totals.netPaid,
      totalDue: effectiveTotalDue,
      balanceAfter: balance,
      paymentStatus: status,
      paymentDate: now,
      paymentNotes: values.notes.trim() || null,
      transaction: {
        description: transactionDescription,
        amount: requestedAmount,
        method: values.method,
        transacted_at: now,
        ...transactionVatFields,
      },
      reservationAmountPaid: newNetPaid,
      reservationBalance: balance,
      reservationTotalAmount: effectiveTotalDue,
      reservationTaxes,
      postFolioCredit:
        Boolean(this.folios) && reservation.status === "checked_in",
      folioCreditAmount: requestedAmount,
      folioCreditReference: null,
    });

    if (!commitResult.idempotentReplay) {
      const createdTx = await this.payments
        .getTransactions(commitResult.paymentId)
        .then((txs) => txs.find((tx) => tx.id === commitResult.transactionId));

      if (createdTx?.receipt_number) {
        await this.logReceiptGenerated(
          ctx,
          session,
          commitResult.paymentId,
          createdTx,
          1
        );
      }

      await this.log(ctx, session, {
        action: "Payment recorded",
        actionCode: ActivityActionCodes.PAYMENT_RECORDED,
        paymentId: commitResult.paymentId,
        metadata: {
          reservationId: reservation.id,
          transaction_number: 1,
          amount: requestedAmount,
          method: values.method,
          total_paid: requestedAmount,
          balance_remaining: balance,
          methods_used: formatMethodsUsed(
            getMethodsUsed([{ method: values.method, amount: requestedAmount }])
          ),
          reference: commitResult.reference,
          receipt_number: commitResult.receiptNumber,
          vat_applied: vatFields.vat_applied,
          vat_rate: vatFields.vat_rate,
          vat_amount: vatFields.vat_amount,
        },
      });

      await this.logVatOverride(ctx, session, commitResult.paymentId, vatFields);

      if (folioSettlement && this.folios) {
        await this.folios.syncReservationSettlement(reservation.id);
      }
    }

    const payment = await this.mapPayment(commitResult.paymentId);
    if (!payment) {
      throw new PaymentAtomicError();
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
    if (!values.idempotencyKey?.trim()) {
      throw new ServiceError(
        "Refund idempotency key is required.",
        "VALIDATION",
        400
      );
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

    const folioSettlement = this.folios
      ? await this.folios.getAuthoritativeSettlement(reservation.id)
      : null;

    const totalDue = roundCurrency(
      folioSettlement?.totalAmount ?? Number(reservation.total_amount)
    );
    const now = new Date().toISOString();

    const projectedTotals = computeTransactionTotals([
      ...transactions,
      { amount: -refundAmount },
    ]);
    const newNetPaid = projectedTotals.netPaid;
    const balance = computeOutstandingBalance(totalDue, newNetPaid);
    const status = resolvePaymentStatusFromTotals(totalDue, projectedTotals);
    const aggregatedMethod = aggregatePaymentMethod([
      ...transactions,
      { amount: -refundAmount, method: values.method },
    ]);
    const refundCount = transactions.filter((tx) => Number(tx.amount) < 0).length + 1;

    const commitResult = await this.payments.commitRefundAtomically({
      idempotencyKey: values.idempotencyKey,
      paymentId: existing.id,
      reservationId: reservation.id,
      paymentMethod: aggregatedMethod,
      paymentAmount: newNetPaid,
      balanceAfter: balance,
      paymentStatus: status,
      paymentDate: now,
      transaction: {
        description: buildRefundDescription(values.reason, values.notes),
        amount: -refundAmount,
        method: values.method,
        transacted_at: now,
      },
      reservationAmountPaid: newNetPaid,
      reservationBalance: balance,
    });

    if (!commitResult.idempotentReplay) {
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
          total_refunded: projectedTotals.totalRefunded,
          net_paid: newNetPaid,
          refund_number: refundCount,
        },
      });
      if (folioSettlement && this.folios) {
        await this.folios.integratePaymentRefund(
          ctx,
          session,
          reservation.id,
          refundAmount,
          existing.reference
        );
        await this.folios.syncReservationSettlement(reservation.id);
      }
    }

    const payment = await this.mapPayment(existing.id);
    if (!payment) {
      throw new PaymentAtomicError();
    }
    return payment;
  }

  async recordReceiptPrint(
    ctx: ServiceContext,
    session: AuthSession,
    transactionId: string
  ): Promise<{ printCount: number; receiptNumber: string }> {
    this.require(session, "view");

    const transaction = await this.payments.getTransactionById(transactionId);
    if (!transaction?.receipt_number) {
      throw new ServiceError("Receipt not available for this transaction", "NOT_FOUND", 404);
    }

    const result = await this.payments.recordReceiptPrint(
      transactionId,
      ctx.userId
    );

    const actionCode =
      result.printCount > 1
        ? ActivityActionCodes.PAYMENT_RECEIPT_REPRINTED
        : ActivityActionCodes.PAYMENT_RECEIPT_PRINTED;

    await this.log(ctx, session, {
      action: result.printCount > 1 ? "Receipt Reprinted" : "Receipt Printed",
      actionCode,
      paymentId: transaction.payment_id,
      metadata: {
        transaction_id: transactionId,
        receipt_number: result.receiptNumber,
        print_count: result.printCount,
      },
    });

    return result;
  }
}
