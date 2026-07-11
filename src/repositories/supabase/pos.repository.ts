import type { CreatePosSaleInput, IPosRepository, PosSaleListFilters } from "@/repositories/pos.repository";
import {
  buildPosCommitPayload,
  isPosStockUnavailableError,
  mapRpcPosCommitResult,
  PosAtomicError,
  PosStockUnavailableError,
  type PosAtomicCommitInput,
  type PosAtomicCommitResult,
  type RpcPosCommitRow,
} from "@/lib/pos/atomic-commit";
import type { PaginatedResult, PaginationParams } from "@/repositories/types";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbSalePayment, DbSaleWithRelations } from "@/types/database";

const SALE_LIST_SELECT = `
  *,
  payments:sale_payments ( id, payment_method, receipt_number, amount, reference, created_at ),
  cashier:users!sales_cashier_id_fkey ( id, full_name ),
  guest:guests!sales_guest_id_fkey ( id, full_name ),
  reservation:reservations!sales_reservation_id_fkey (
    id,
    reservation_number,
    room:rooms!reservations_room_id_fkey ( room_number )
  )
`;

const SALE_SELECT = `
  *,
  items:sale_items (*),
  payments:sale_payments (*),
  cashier:users!sales_cashier_id_fkey ( id, full_name ),
  guest:guests!sales_guest_id_fkey ( id, full_name ),
  reservation:reservations!sales_reservation_id_fkey (
    id,
    reservation_number,
    room:rooms!reservations_room_id_fkey ( room_number )
  )
`;

type SaleRow = DbSaleWithRelations;

function toSaleWithRelations(row: SaleRow | null): DbSaleWithRelations | null {
  if (!row) return null;
  return {
    ...row,
    items: row.items ?? [],
    payments: row.payments ?? [],
    cashier: row.cashier ?? null,
    guest: row.guest ?? null,
    reservation: row.reservation ?? null,
  };
}

function toSaleListRow(row: SaleRow | null): DbSaleWithRelations | null {
  if (!row) return null;
  return {
    ...row,
    items: row.items ?? [],
    payments: row.payments ?? [],
    cashier: row.cashier ?? null,
    guest: row.guest ?? null,
    reservation: row.reservation ?? null,
  };
}

export class SupabasePosRepository implements IPosRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getNextSaleNumber(): Promise<string> {
    const { data, error } = await this.client.rpc("next_sale_number");
    if (error) {
      throw new Error(`Failed to generate sale number: ${error.message}`);
    }
    return String(data);
  }

  async getNextReceiptNumber(): Promise<string> {
    const { data, error } = await this.client.rpc("next_pos_receipt_number");
    if (error) {
      throw new Error(`Failed to generate receipt number: ${error.message}`);
    }
    return String(data);
  }

  async createSale(input: CreatePosSaleInput): Promise<DbSaleWithRelations> {
    const { data: sale, error: saleError } = await this.client
      .from("sales")
      .insert({
        id: input.id,
        sale_number: input.saleNumber,
        customer_type: input.customerType,
        reservation_id: input.reservationId ?? null,
        guest_id: input.guestId ?? null,
        cashier_id: input.cashierId,
        subtotal: input.subtotal,
        vat_amount: input.vatAmount,
        discount: input.discount,
        total: input.total,
        payment_status: input.paymentStatus,
        vat_applied: input.vatApplied,
        vat_rate: input.vatRate,
        notes: input.notes ?? null,
      })
      .select("*")
      .single();

    if (saleError || !sale) {
      throw new Error(`Failed to create sale: ${saleError?.message ?? "unknown"}`);
    }

    const { error: itemsError } = await this.client.from("sale_items").insert(
      input.items.map((item) => ({
        sale_id: input.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        vat_applicable: item.vatApplicable,
        vat_amount: item.vatAmount,
        line_subtotal: item.lineSubtotal,
        total: item.total,
      }))
    );

    if (itemsError) {
      throw new Error(`Failed to create sale items: ${itemsError.message}`);
    }

    if (input.payment) {
      const { error: paymentError } = await this.client.from("sale_payments").insert({
        sale_id: input.id,
        payment_method: input.payment.paymentMethod,
        amount: input.payment.amount,
        reference: input.payment.reference ?? null,
        receipt_number: input.payment.receiptNumber ?? null,
      });

      if (paymentError) {
        throw new Error(`Failed to create sale payment: ${paymentError.message}`);
      }
    }

    const full = await this.getById(input.id);
    if (!full) {
      throw new Error("Failed to load created sale");
    }
    return full;
  }

  async getById(id: string): Promise<DbSaleWithRelations | null> {
    const { data, error } = await this.client
      .from("sales")
      .select(SALE_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load sale: ${error.message}`);
    }

    return toSaleWithRelations(data as unknown as SaleRow);
  }

  async listPaymentsForBusinessDate(businessDate: string): Promise<DbSalePayment[]> {
    const start = `${businessDate}T00:00:00.000Z`;
    const end = `${businessDate}T23:59:59.999Z`;

    const { data, error } = await this.client
      .from("sale_payments")
      .select("*")
      .gte("created_at", start)
      .lte("created_at", end);

    if (error) {
      throw new Error(`Failed to list POS payments: ${error.message}`);
    }

    return data ?? [];
  }

  async listSalesForBusinessDate(businessDate: string) {
    const start = `${businessDate}T00:00:00.000Z`;
    const end = `${businessDate}T23:59:59.999Z`;

    const { data, error } = await this.client
      .from("sales")
      .select("*")
      .gte("created_at", start)
      .lte("created_at", end);

    if (error) {
      throw new Error(`Failed to list POS sales: ${error.message}`);
    }

    return data ?? [];
  }

  private async findSaleIdsMatchingSearch(term: string): Promise<string[]> {
    const pattern = `%${term}%`;
    const ids = new Set<string>();

    const [
      { data: bySaleNumber },
      { data: byReceipt },
      { data: byGuest },
      { data: byCashier },
      { data: byRoom },
    ] = await Promise.all([
      this.client.from("sales").select("id").ilike("sale_number", pattern),
      this.client
        .from("sale_payments")
        .select("sale_id")
        .ilike("receipt_number", pattern),
      this.client.from("guests").select("id").ilike("full_name", pattern),
      this.client.from("users").select("id").ilike("full_name", pattern),
      this.client.from("rooms").select("id").ilike("room_number", pattern),
    ]);

    for (const row of bySaleNumber ?? []) {
      ids.add(row.id);
    }
    for (const row of byReceipt ?? []) {
      ids.add(row.sale_id);
    }

    const guestIds = (byGuest ?? []).map((row) => row.id);
    if (guestIds.length) {
      const { data: guestSales } = await this.client
        .from("sales")
        .select("id")
        .in("guest_id", guestIds);
      for (const row of guestSales ?? []) {
        ids.add(row.id);
      }
    }

    const cashierIds = (byCashier ?? []).map((row) => row.id);
    if (cashierIds.length) {
      const { data: cashierSales } = await this.client
        .from("sales")
        .select("id")
        .in("cashier_id", cashierIds);
      for (const row of cashierSales ?? []) {
        ids.add(row.id);
      }
    }

    const roomIds = (byRoom ?? []).map((row) => row.id);
    if (roomIds.length) {
      const { data: reservations } = await this.client
        .from("reservations")
        .select("id")
        .in("room_id", roomIds);
      const reservationIds = (reservations ?? []).map((row) => row.id);
      if (reservationIds.length) {
        const { data: roomSales } = await this.client
          .from("sales")
          .select("id")
          .in("reservation_id", reservationIds);
        for (const row of roomSales ?? []) {
          ids.add(row.id);
        }
      }
    }

    return [...ids];
  }

  async findAll(
    filters?: PosSaleListFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<DbSaleWithRelations>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;

    let matchingIds: string[] | null = null;
    if (filters?.search?.trim()) {
      matchingIds = await this.findSaleIdsMatchingSearch(filters.search.trim());
      if (!matchingIds.length) {
        return { data: [], total: 0, page, pageSize };
      }
    }

    let query = this.client
      .from("sales")
      .select(SALE_LIST_SELECT, { count: "exact" })
      .order("created_at", { ascending: false });

    if (matchingIds) {
      query = query.in("id", matchingIds);
    }
    if (filters?.customerType) {
      query = query.eq("customer_type", filters.customerType);
    }
    if (filters?.cashierId) {
      query = query.eq("cashier_id", filters.cashierId);
    }
    if (filters?.dateFrom) {
      query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
    }
    if (filters?.paymentMethod) {
      if (filters.paymentMethod === "room_charge") {
        query = query.eq("customer_type", "room_charge");
      } else {
        query = query
          .eq("customer_type", "walk_in")
          .eq("payments.payment_method", filters.paymentMethod);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count, error } = await query.range(from, to);

    if (error) {
      throw new Error(`Failed to list POS sales: ${error.message}`);
    }

    return {
      data: (data ?? [])
        .map((row) => toSaleListRow(row as unknown as SaleRow))
        .filter((row): row is DbSaleWithRelations => Boolean(row)),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async listCashiers() {
    const { data, error } = await this.client
      .from("sales")
      .select("cashier_id, cashier:users!sales_cashier_id_fkey ( id, full_name )")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      throw new Error(`Failed to list POS cashiers: ${error.message}`);
    }

    const map = new Map<string, string>();
    for (const row of data ?? []) {
      const cashier = row.cashier as unknown as { id: string; full_name: string } | null;
      if (cashier?.id && cashier.full_name) {
        map.set(cashier.id, cashier.full_name);
      } else if (row.cashier_id) {
        map.set(row.cashier_id, row.cashier_id);
      }
    }

    return [...map.entries()]
      .map(([id, fullName]) => ({ id, fullName }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async commitSaleAtomically(
    input: PosAtomicCommitInput
  ): Promise<PosAtomicCommitResult> {
    const { data, error } = await this.client.rpc("shms_commit_pos_sale", {
      p_payload: buildPosCommitPayload(input),
    });

    if (error) {
      if (isPosStockUnavailableError(error)) {
        throw new PosStockUnavailableError();
      }
      throw new PosAtomicError();
    }

    return mapRpcPosCommitResult((data ?? {}) as RpcPosCommitRow);
  }

  async sumRoomChargeTotalByGuestId(guestId: string): Promise<number> {
    const { data, error } = await this.client
      .from("sales")
      .select("total")
      .eq("guest_id", guestId)
      .eq("customer_type", "room_charge");

    if (error) {
      throw new Error(`Failed to sum guest POS spend: ${error.message}`);
    }

    return (data ?? []).reduce((sum, row) => sum + Number(row.total), 0);
  }
}
