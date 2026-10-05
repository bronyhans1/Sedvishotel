import type {
  OperationalPaymentRow,
  OperationalTransactionAmount,
} from "@/lib/payments/operational-summary";
import {
  normalizePaymentSearch,
  paymentSearchLikePattern,
} from "@/lib/payments/search";
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
  AnalyticsPaymentListItem,
  CreatePaymentTransactionInput,
  IPaymentRepository,
} from "@/repositories/payment.repository";
import type { PaginatedResult } from "@/repositories/types";
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

/** Same relations as the payment list, required so incomplete rows stay hidden. */
const PAYMENT_LIST_SELECT = `
  *,
  guest:guests!payments_guest_id_fkey!inner (*),
  reservation:reservations!payments_reservation_id_fkey!inner (
    *,
    guest:guests!reservations_guest_id_fkey!inner (*),
    room:rooms!reservations_room_id_fkey!inner (*),
    room_type:room_types!reservations_room_type_id_fkey!inner (*)
  )
`;

const PAYMENT_OPERATIONAL_SELECT = `
  id,
  reference,
  reservation_id,
  status,
  payment_date,
  balance_after,
  total_due,
  created_at,
  guest:guests!payments_guest_id_fkey!inner (id),
  reservation:reservations!payments_reservation_id_fkey!inner (
    id,
    guest:guests!reservations_guest_id_fkey!inner (id),
    room:rooms!reservations_room_id_fkey!inner (id),
    room_type:room_types!reservations_room_type_id_fkey!inner (id)
  )
`;

const READ_BATCH = 1000;
const IN_CHUNK = 100;

/** Analytics: payment row + display labels only (no nested guest/room_type trees). */
const PAYMENT_ANALYTICS_SELECT = `
  id,
  reference,
  reservation_id,
  guest_id,
  method,
  amount,
  total_due,
  balance_after,
  status,
  payment_date,
  notes,
  recorded_by,
  created_at,
  updated_at,
  guest:guests!payments_guest_id_fkey (full_name),
  reservation:reservations!payments_reservation_id_fkey (
    reservation_number,
    room:rooms!reservations_room_id_fkey (room_number)
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

type PaymentAnalyticsRow = DbPayment & {
  guest: { full_name: string } | null;
  reservation: {
    reservation_number: string;
    room: { room_number: string } | null;
  } | null;
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

function chunkValues<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function comparePaymentOrder(
  a: { payment_date: string; created_at: string; id: string },
  b: { payment_date: string; created_at: string; id: string }
): number {
  const byDate = b.payment_date.localeCompare(a.payment_date);
  if (byDate !== 0) return byDate;
  const byCreated = b.created_at.localeCompare(a.created_at);
  if (byCreated !== 0) return byCreated;
  return b.id.localeCompare(a.id);
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

  async listPage(input: {
    page: number;
    pageSize: number;
    search?: string;
  }): Promise<PaginatedResult<DbPaymentWithRelations>> {
    const page = input.page > 0 ? Math.floor(input.page) : 1;
    const pageSize = input.pageSize > 0 ? Math.floor(input.pageSize) : 25;
    const search = normalizePaymentSearch(input.search);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (!search) {
      const [countResult, dataResult] = await Promise.all([
        this.client
          .from("payments")
          .select(PAYMENT_OPERATIONAL_SELECT, { count: "exact", head: true }),
        this.client
          .from("payments")
          .select(PAYMENT_LIST_SELECT)
          .order("payment_date", { ascending: false })
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to),
      ]);

      if (countResult.error) {
        throw new Error(`Failed to count payments: ${countResult.error.message}`);
      }
      if (dataResult.error) {
        throw new Error(`Failed to list payments: ${dataResult.error.message}`);
      }

      return {
        data: (dataResult.data ?? [])
          .map((row) => toPaymentWithRelations(row as unknown as PaymentRow))
          .filter((row): row is DbPaymentWithRelations => Boolean(row)),
        total: countResult.count ?? 0,
        page,
        pageSize,
      };
    }

    const ordered = await this.listVisiblePaymentOrder(search);
    const pageKeys = ordered.slice(from, to + 1);
    if (pageKeys.length === 0) {
      return { data: [], total: ordered.length, page, pageSize };
    }

    const { data, error } = await this.client
      .from("payments")
      .select(PAYMENT_LIST_SELECT)
      .in(
        "id",
        pageKeys.map((row) => row.id)
      );

    if (error) {
      throw new Error(`Failed to list payments: ${error.message}`);
    }

    const byId = new Map<string, DbPaymentWithRelations>();
    for (const raw of data ?? []) {
      const row = toPaymentWithRelations(raw as unknown as PaymentRow);
      if (row) byId.set(row.id, row);
    }

    return {
      data: pageKeys.flatMap((key) => {
        const row = byId.get(key.id);
        return row ? [row] : [];
      }),
      total: ordered.length,
      page,
      pageSize,
    };
  }

  async listOperationalRows(): Promise<OperationalPaymentRow[]> {
    const rows: OperationalPaymentRow[] = [];
    for (let offset = 0; ; offset += READ_BATCH) {
      const { data, error } = await this.client
        .from("payments")
        .select(PAYMENT_OPERATIONAL_SELECT)
        .order("id", { ascending: true })
        .range(offset, offset + READ_BATCH - 1);

      if (error) {
        throw new Error(`Failed to load payment statistics rows: ${error.message}`);
      }

      const batch = data ?? [];
      for (const raw of batch) {
        const row = raw as unknown as {
          id: string;
          reference: string;
          reservation_id: string;
          status: OperationalPaymentRow["status"];
          payment_date: string;
          balance_after: number | string;
          total_due: number | string;
          created_at: string;
        };
        rows.push({
          id: row.id,
          reference: row.reference,
          reservationId: row.reservation_id,
          status: row.status,
          paymentDate: row.payment_date,
          balanceAfter: row.balance_after,
          totalDue: row.total_due,
          createdAt: row.created_at,
        });
      }
      if (batch.length < READ_BATCH) break;
    }
    return rows;
  }

  async listTransactionAmounts(): Promise<OperationalTransactionAmount[]> {
    const amounts: OperationalTransactionAmount[] = [];
    for (let offset = 0; ; offset += READ_BATCH) {
      const { data, error } = await this.client
        .from("payment_transactions")
        .select("id, payment_id, amount")
        .order("id", { ascending: true })
        .range(offset, offset + READ_BATCH - 1);

      if (error) {
        throw new Error(`Failed to load payment transaction amounts: ${error.message}`);
      }

      const batch = data ?? [];
      for (const row of batch) {
        amounts.push({ paymentId: row.payment_id, amount: row.amount });
      }
      if (batch.length < READ_BATCH) break;
    }
    return amounts;
  }

  private async listVisiblePaymentOrder(
    search: string
  ): Promise<{ id: string; payment_date: string; created_at: string }[]> {
    const ids = await this.findPaymentIdsForSearch(search);
    if (ids.length === 0) return [];

    const keys: { id: string; payment_date: string; created_at: string }[] = [];
    for (const idChunk of chunkValues(ids, IN_CHUNK)) {
      for (let offset = 0; ; offset += READ_BATCH) {
        const { data, error } = await this.client
          .from("payments")
          .select(PAYMENT_OPERATIONAL_SELECT)
          .in("id", idChunk)
          .order("id", { ascending: true })
          .range(offset, offset + READ_BATCH - 1);

        if (error) {
          throw new Error(`Failed to order searched payments: ${error.message}`);
        }

        const batch = data ?? [];
        for (const raw of batch) {
          const row = raw as unknown as {
            id: string;
            payment_date: string;
            created_at: string;
          };
          keys.push({
            id: row.id,
            payment_date: row.payment_date,
            created_at: row.created_at,
          });
        }
        if (batch.length < READ_BATCH) break;
      }
    }

    keys.sort(comparePaymentOrder);
    return keys;
  }

  private async findPaymentIdsForSearch(search: string): Promise<string[]> {
    const pattern = paymentSearchLikePattern(search);
    const [byReference, guestIds, reservationIds, roomIds] = await Promise.all([
      this.collectIds(
        (from, to) =>
          this.client
            .from("payments")
            .select("id")
            .ilike("reference", pattern)
            .order("id", { ascending: true })
            .range(from, to),
        "payment references"
      ),
      this.collectIds(
        (from, to) =>
          this.client
            .from("guests")
            .select("id")
            .ilike("full_name", pattern)
            .order("id", { ascending: true })
            .range(from, to),
        "guest names"
      ),
      this.collectIds(
        (from, to) =>
          this.client
            .from("reservations")
            .select("id")
            .ilike("reservation_number", pattern)
            .order("id", { ascending: true })
            .range(from, to),
        "reservation numbers"
      ),
      this.collectIds(
        (from, to) =>
          this.client
            .from("rooms")
            .select("id")
            .like("room_number", pattern)
            .order("id", { ascending: true })
            .range(from, to),
        "room numbers"
      ),
    ]);

    const reservationIdsForRooms = await this.collectIdsByColumn(
      "reservations",
      "room_id",
      roomIds,
      "reservations for rooms"
    );
    const [byGuest, byReservation, byRoom] = await Promise.all([
      this.collectIdsByColumn("payments", "guest_id", guestIds, "payments for guests"),
      this.collectIdsByColumn(
        "payments",
        "reservation_id",
        reservationIds,
        "payments for reservations"
      ),
      this.collectIdsByColumn(
        "payments",
        "reservation_id",
        reservationIdsForRooms,
        "payments for rooms"
      ),
    ]);

    return [...new Set([...byReference, ...byGuest, ...byReservation, ...byRoom])];
  }

  private async collectIds(
    load: (
      from: number,
      to: number
    ) => PromiseLike<{ data: { id: string }[] | null; error: { message: string } | null }>,
    label: string
  ): Promise<string[]> {
    const ids: string[] = [];
    for (let offset = 0; ; offset += READ_BATCH) {
      const { data, error } = await load(offset, offset + READ_BATCH - 1);
      if (error) {
        throw new Error(`Failed to search ${label}: ${error.message}`);
      }
      const batch = data ?? [];
      for (const row of batch) ids.push(row.id);
      if (batch.length < READ_BATCH) break;
    }
    return ids;
  }

  private async collectIdsByColumn(
    table: "payments" | "reservations",
    column: "guest_id" | "reservation_id" | "room_id",
    foreignIds: string[],
    label: string
  ): Promise<string[]> {
    if (foreignIds.length === 0) return [];
    const ids: string[] = [];
    for (const foreignChunk of chunkValues(foreignIds, IN_CHUNK)) {
      const matched = await this.collectIds((from, to) => {
        const query = this.client.from(table).select("id").order("id", { ascending: true });
        if (column === "guest_id") {
          return query.in("guest_id", foreignChunk).range(from, to);
        }
        if (column === "reservation_id") {
          return query.in("reservation_id", foreignChunk).range(from, to);
        }
        return query.in("room_id", foreignChunk).range(from, to);
      }, label);
      ids.push(...matched);
    }
    return ids;
  }

  async listForAnalytics(): Promise<AnalyticsPaymentListItem[]> {
    const { data, error } = await this.client
      .from("payments")
      .select(PAYMENT_ANALYTICS_SELECT)
      .order("payment_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to list payments for analytics: ${error.message}`);
    }

    const items: AnalyticsPaymentListItem[] = [];
    for (const raw of data ?? []) {
      const row = raw as unknown as PaymentAnalyticsRow;
      if (!row.guest?.full_name || !row.reservation?.reservation_number) {
        continue;
      }
      const roomNumber = row.reservation.room?.room_number;
      if (!roomNumber) continue;

      const payment = {
        id: row.id,
        reference: row.reference,
        reservation_id: row.reservation_id,
        guest_id: row.guest_id,
        method: row.method,
        amount: row.amount,
        total_due: row.total_due,
        balance_after: row.balance_after,
        status: row.status,
        payment_date: row.payment_date,
        notes: row.notes,
        recorded_by: row.recorded_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
      } satisfies DbPayment;

      items.push({
        payment,
        guestName: row.guest.full_name,
        reservationNumber: row.reservation.reservation_number,
        roomNumber,
      });
    }
    return items;
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

  async getTransactionById(id: string): Promise<DbPaymentTransaction | null> {
    const { data, error } = await this.client
      .from("payment_transactions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load payment transaction: ${error.message}`);
    }

    return data;
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
    const { data, error } = await this.client.rpc("next_payment_receipt_locked");

    if (error) {
      throw new Error(`Failed to generate receipt number: ${error.message}`);
    }

    if (typeof data !== "string" || !data.trim()) {
      throw new Error("Failed to generate receipt number: empty response");
    }

    return data;
  }

  async recordReceiptPrint(
    transactionId: string,
    userId: string
  ): Promise<{ printCount: number; receiptNumber: string }> {
    const { data, error } = await this.client.rpc("shms_record_payment_receipt_print", {
      p_transaction_id: transactionId,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to record receipt print: ${error.message}`);
    }

    const payload = data as {
      print_count?: number;
      receipt_number?: string;
    } | null;

    return {
      printCount: Number(payload?.print_count ?? 1),
      receiptNumber: String(payload?.receipt_number ?? ""),
    };
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

  async listPaymentMethodsForGuest(guestId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("payments")
      .select("method")
      .eq("guest_id", guestId);

    if (error) {
      throw new Error(`Failed to load guest payment methods: ${error.message}`);
    }

    return (data ?? []).map((row) => String(row.method));
  }
}
