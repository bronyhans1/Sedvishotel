import { isUuid } from "@/lib/payments/mapper";
import {
  buildPaymentCommitPayload,
  buildPaymentRefundPayload,
  mapRpcCommitResult,
  mapRpcRefundResult,
  PaymentAtomicError,
  type PaymentAtomicCommitInput,
  type PaymentAtomicCommitResult,
  type PaymentAtomicRefundInput,
  type PaymentAtomicRefundResult,
  type RpcPaymentCommitRow,
} from "@/lib/payments/atomic-commit";
import type {
  CreatePaymentTransactionInput,
  IPaymentRepository,
} from "@/repositories/payment.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  DbPayment,
  DbPaymentTransaction,
  DbPaymentWithRelations,
  DbReservationWithRelations,
} from "@/types/database";

const PAYMENT_SELECT = `
  *,
  guest:guests!payments_guest_id_fkey (*),
  reservation:reservations!payments_reservation_id_fkey (
    *,
    guest:guests!reservations_guest_id_fkey (*),
    room:rooms!reservations_room_id_fkey (*),
    room_type:room_types!reservations_room_type_id_fkey (*)
  )
`;

type PaymentRow = DbPayment & {
  guest: DbPaymentWithRelations["guest"] | null;
  reservation: (DbReservationWithRelations & {
    guest: DbReservationWithRelations["guest"] | null;
    room: DbReservationWithRelations["room"] | null;
    room_type: DbReservationWithRelations["room_type"] | null;
  }) | null;
};

function toPaymentWithRelations(
  row: PaymentRow | null
): DbPaymentWithRelations | null {
  if (!row?.guest || !row.reservation) return null;
  const reservation = row.reservation;
  if (!reservation.guest || !reservation.room || !reservation.room_type) {
    return null;
  }
  return {
    ...row,
    guest: row.guest,
    reservation: {
      ...reservation,
      guest: reservation.guest,
      room: reservation.room,
      room_type: reservation.room_type,
    },
  };
}

function mapTransactionInsertFields(transaction: CreatePaymentTransactionInput) {
  return {
    description: transaction.description,
    amount: transaction.amount,
    method: transaction.method,
    transacted_at: transaction.transacted_at ?? new Date().toISOString(),
    vat_applied: transaction.vat_applied ?? true,
    vat_rate: transaction.vat_rate ?? 0,
    vat_amount: transaction.vat_amount ?? 0,
    vat_exemption_reason: transaction.vat_exemption_reason ?? null,
    vat_exemption_notes: transaction.vat_exemption_notes ?? null,
    vat_overridden_by: transaction.vat_overridden_by ?? null,
    vat_overridden_at: transaction.vat_overridden_at ?? null,
  };
}

export class SupabasePaymentRepository implements IPaymentRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getAll(): Promise<DbPaymentWithRelations[]> {
    const { data, error } = await this.client
      .from("payments")
      .select(PAYMENT_SELECT)
      .order("payment_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to list payments: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toPaymentWithRelations(row as unknown as PaymentRow))
      .filter((row): row is DbPaymentWithRelations => Boolean(row));
  }

  async getByReservationId(
    reservationId: string
  ): Promise<DbPaymentWithRelations | null> {
    const { data, error } = await this.client
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("reservation_id", reservationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to load payment for reservation: ${error.message}`
      );
    }

    return toPaymentWithRelations((data ?? null) as unknown as PaymentRow | null);
  }

  async getById(id: string): Promise<DbPaymentWithRelations | null> {
    if (isUuid(id)) {
      const { data, error } = await this.client
        .from("payments")
        .select(PAYMENT_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load payment: ${error.message}`);
      }

      return toPaymentWithRelations((data ?? null) as unknown as PaymentRow | null);
    }

    const { data, error } = await this.client
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("reference", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load payment by reference: ${error.message}`);
    }

    return toPaymentWithRelations((data ?? null) as unknown as PaymentRow | null);
  }

  async getTransactions(paymentId: string): Promise<DbPaymentTransaction[]> {
    const { data, error } = await this.client
      .from("payment_transactions")
      .select("*")
      .eq("payment_id", paymentId)
      .order("transacted_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to load payment transactions: ${error.message}`);
    }

    return data ?? [];
  }

  async getTransactionsForIds(
    paymentIds: string[]
  ): Promise<Map<string, DbPaymentTransaction[]>> {
    const map = new Map<string, DbPaymentTransaction[]>();
    if (paymentIds.length === 0) return map;

    const { data, error } = await this.client
      .from("payment_transactions")
      .select("*")
      .in("payment_id", paymentIds)
      .order("transacted_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to load payment transactions: ${error.message}`);
    }

    for (const row of data ?? []) {
      const list = map.get(row.payment_id) ?? [];
      list.push(row);
      map.set(row.payment_id, list);
    }

    return map;
  }

  async create(
    payment: Omit<DbPayment, "id" | "created_at" | "updated_at">,
    transaction: CreatePaymentTransactionInput
  ): Promise<{ payment: DbPayment; transaction: DbPaymentTransaction }> {
    const { data: row, error } = await this.client
      .from("payments")
      .insert(payment)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to create payment: ${error?.message ?? "unknown"}`);
    }

    const baseFields = mapTransactionInsertFields(transaction);
    const receiptNumber =
      Number(transaction.amount) > 0
        ? transaction.receipt_number ?? (await this.getNextReceiptNumber())
        : null;

    const { data: txRow, error: txError } = await this.client
      .from("payment_transactions")
      .insert({
        payment_id: row.id,
        ...baseFields,
        receipt_number: receiptNumber,
      })
      .select("*")
      .single();

    if (txError || !txRow) {
      throw new Error(
        `Failed to record payment transaction: ${txError?.message ?? "unknown"}`
      );
    }

    return { payment: row, transaction: txRow };
  }

  async addTransaction(
    paymentId: string,
    transaction: CreatePaymentTransactionInput
  ): Promise<DbPaymentTransaction> {
    const baseFields = mapTransactionInsertFields(transaction);
    const receiptNumber =
      Number(transaction.amount) > 0
        ? transaction.receipt_number ?? (await this.getNextReceiptNumber())
        : null;

    const { data, error } = await this.client
      .from("payment_transactions")
      .insert({
        payment_id: paymentId,
        ...baseFields,
        receipt_number: receiptNumber,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to record payment transaction: ${error?.message ?? "unknown"}`);
    }

    return data;
  }

  async update(id: string, data: Partial<DbPayment>): Promise<DbPayment> {
    const { data: row, error } = await this.client
      .from("payments")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to update payment: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async getNextReference(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}-`;

    const { count, error } = await this.client
      .from("payments")
      .select("*", { count: "exact", head: true })
      .like("reference", `${prefix}%`);

    if (error) {
      throw new Error(`Failed to generate payment reference: ${error.message}`);
    }

    const seq = String((count ?? 0) + 1).padStart(4, "0");
    return `${prefix}${seq}`;
  }

  async getNextReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCPT-${year}-`;

    const { data, error } = await this.client
      .from("payment_transactions")
      .select("receipt_number")
      .like("receipt_number", `${prefix}%`)
      .order("receipt_number", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to generate receipt number: ${error.message}`);
    }

    const last = data?.[0]?.receipt_number;
    const nextSeq = last
      ? Number.parseInt(last.slice(-6), 10) + 1
      : 1;

    return `${prefix}${String(nextSeq).padStart(6, "0")}`;
  }

  async getTransactionsForBusinessDate(
    businessDate: string
  ): Promise<DbPaymentTransaction[]> {
    const start = new Date(`${businessDate}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const { data, error } = await this.client
      .from("payment_transactions")
      .select("*")
      .gte("transacted_at", start.toISOString())
      .lt("transacted_at", end.toISOString())
      .order("transacted_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to load transactions for ${businessDate}: ${error.message}`);
    }

    return data ?? [];
  }

  async commitPaymentAtomically(
    input: PaymentAtomicCommitInput
  ): Promise<PaymentAtomicCommitResult> {
    const { data, error } = await this.client.rpc("shms_commit_payment", {
      p_payload: buildPaymentCommitPayload(input),
    });

    if (error) {
      throw new PaymentAtomicError();
    }

    return mapRpcCommitResult((data ?? {}) as RpcPaymentCommitRow);
  }

  async commitRefundAtomically(
    input: PaymentAtomicRefundInput
  ): Promise<PaymentAtomicRefundResult> {
    const { data, error } = await this.client.rpc("shms_commit_payment_refund", {
      p_payload: buildPaymentRefundPayload(input),
    });

    if (error) {
      throw new PaymentAtomicError();
    }

    return mapRpcRefundResult((data ?? {}) as RpcPaymentCommitRow);
  }
}
