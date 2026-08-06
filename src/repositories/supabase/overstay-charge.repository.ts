import type {
  CreateOverstayChargeInput,
  IOverstayChargeRepository,
  UpdateOverstayChargeInput,
} from "@/repositories/overstay-charge.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbOverstayCharge, DbOverstayChargeStatus } from "@/types/database";

export class SupabaseOverstayChargeRepository
  implements IOverstayChargeRepository
{
  constructor(private readonly client: SupabaseServerClient) {}

  async getByReservationAndBusinessDate(
    reservationId: string,
    businessDate: string
  ): Promise<DbOverstayCharge | null> {
    const { data, error } = await this.client
      .from("overstay_charges")
      .select("*")
      .eq("reservation_id", reservationId)
      .eq("business_date", businessDate)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to load overstay charge: ${error.message}`);
    }
    return data;
  }

  async getById(id: string): Promise<DbOverstayCharge | null> {
    const { data, error } = await this.client
      .from("overstay_charges")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to load overstay charge by id: ${error.message}`);
    }
    return data;
  }

  async getBySourceReference(
    sourceReference: string
  ): Promise<DbOverstayCharge | null> {
    const { data, error } = await this.client
      .from("overstay_charges")
      .select("*")
      .eq("source_reference", sourceReference)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to load overstay charge by reference: ${error.message}`);
    }
    return data;
  }

  async listByReservation(reservationId: string): Promise<DbOverstayCharge[]> {
    const { data, error } = await this.client
      .from("overstay_charges")
      .select("*")
      .eq("reservation_id", reservationId)
      .order("business_date", { ascending: true });
    if (error) {
      throw new Error(`Failed to list overstay charges: ${error.message}`);
    }
    return data ?? [];
  }

  async listByBusinessDate(businessDate: string): Promise<DbOverstayCharge[]> {
    const { data, error } = await this.client
      .from("overstay_charges")
      .select("*")
      .eq("business_date", businessDate)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(`Failed to list overstay charges by date: ${error.message}`);
    }
    return data ?? [];
  }

  async listByStatus(status: DbOverstayChargeStatus): Promise<DbOverstayCharge[]> {
    const { data, error } = await this.client
      .from("overstay_charges")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to list overstay charges by status: ${error.message}`);
    }
    return data ?? [];
  }

  async listPending(): Promise<DbOverstayCharge[]> {
    return this.listByStatus("pending");
  }

  async listAll(): Promise<DbOverstayCharge[]> {
    const { data, error } = await this.client
      .from("overstay_charges")
      .select("*")
      .order("business_date", { ascending: false });
    if (error) {
      throw new Error(`Failed to list all overstay charges: ${error.message}`);
    }
    return data ?? [];
  }

  async create(input: CreateOverstayChargeInput): Promise<DbOverstayCharge> {
    const { data, error } = await this.client
      .from("overstay_charges")
      .insert({
        reservation_id: input.reservationId,
        business_date: input.businessDate,
        room_number: input.roomNumber,
        charge_mode: input.chargeMode,
        status: input.status,
        amount: input.amount,
        currency: input.currency,
        night_rate: input.nightRate,
        overstay_days: input.overstayDays,
        policy_snapshot: input.policySnapshot,
        source_reference: input.sourceReference,
        decision_notes: input.decisionNotes ?? null,
        created_by: input.createdBy ?? null,
        folio_entry_id: input.folioEntryId ?? null,
        posted_at: input.postedAt ?? null,
      })
      .select("*")
      .single();
    if (error) {
      throw new Error(`Failed to create overstay charge: ${error.message}`);
    }
    return data;
  }

  async update(
    id: string,
    input: UpdateOverstayChargeInput
  ): Promise<DbOverstayCharge> {
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.status !== undefined) patch.status = input.status;
    if (input.amount !== undefined) patch.amount = input.amount;
    if (input.folioEntryId !== undefined) patch.folio_entry_id = input.folioEntryId;
    if (input.decisionNotes !== undefined) patch.decision_notes = input.decisionNotes;
    if (input.approvedBy !== undefined) patch.approved_by = input.approvedBy;
    if (input.approvedAt !== undefined) patch.approved_at = input.approvedAt;
    if (input.waivedBy !== undefined) patch.waived_by = input.waivedBy;
    if (input.waivedAt !== undefined) patch.waived_at = input.waivedAt;
    if (input.rejectedBy !== undefined) patch.rejected_by = input.rejectedBy;
    if (input.rejectedAt !== undefined) patch.rejected_at = input.rejectedAt;
    if (input.postedAt !== undefined) patch.posted_at = input.postedAt;

    const { data, error } = await this.client
      .from("overstay_charges")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      throw new Error(`Failed to update overstay charge: ${error.message}`);
    }
    return data;
  }

  async hasAnyForReservation(
    reservationId: string,
    excludeStatuses: DbOverstayChargeStatus[] = ["rejected"]
  ): Promise<boolean> {
    const rows = await this.listByReservation(reservationId);
    return rows.some((row) => !excludeStatuses.includes(row.status));
  }

  async deleteIfSkipped(id: string): Promise<boolean> {
    const row = await this.getById(id);
    if (!row || row.status !== "skipped") return false;
    const { error } = await this.client
      .from("overstay_charges")
      .delete()
      .eq("id", id)
      .eq("status", "skipped");
    if (error) {
      throw new Error(`Failed to delete skipped overstay charge: ${error.message}`);
    }
    return true;
  }
}
