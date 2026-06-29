import { GUEST_ARCHIVED_MARKER } from "@/lib/guests/constants";
import { isGuestArchived } from "@/lib/guests/mapper";
import type { IGuestRepository } from "@/repositories/guest.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbGuest } from "@/types/database";

export class SupabaseGuestRepository implements IGuestRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getAll(includeArchived = false): Promise<DbGuest[]> {
    const { data, error } = await this.client
      .from("guests")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      throw new Error(`Failed to list guests: ${error.message}`);
    }

    const rows = data ?? [];
    if (includeArchived) return rows;
    return rows.filter((row) => !isGuestArchived(row));
  }

  async getById(id: string): Promise<DbGuest | null> {
    const { data, error } = await this.client
      .from("guests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load guest: ${error.message}`);
    }

    return data;
  }

  async findByEmail(email: string): Promise<DbGuest | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    const { data, error } = await this.client
      .from("guests")
      .select("*")
      .ilike("email", normalized)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find guest by email: ${error.message}`);
    }

    return data;
  }

  async create(
    data: Omit<DbGuest, "id" | "created_at" | "updated_at" | "total_visits" | "total_spent">
  ): Promise<DbGuest> {
    const { data: row, error } = await this.client
      .from("guests")
      .insert(data)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to create guest: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async update(id: string, data: Partial<DbGuest>): Promise<DbGuest> {
    const { data: row, error } = await this.client
      .from("guests")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to update guest: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async archive(id: string): Promise<DbGuest> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Guest not found");
    }

    const notes = Array.isArray(existing.notes) ? [...existing.notes] : [];
    if (!notes.includes(GUEST_ARCHIVED_MARKER)) {
      notes.push(GUEST_ARCHIVED_MARKER);
    }

    return this.update(id, {
      notes,
      guest_status: "checked_out",
    });
  }

  async incrementVisitStats(id: string, amountSpent: number): Promise<DbGuest> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Guest not found");
    }

    return this.update(id, {
      total_visits: existing.total_visits + 1,
      total_spent: Number(existing.total_spent) + amountSpent,
    });
  }
}
