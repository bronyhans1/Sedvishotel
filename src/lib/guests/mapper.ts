import { GUEST_ARCHIVED_MARKER } from "@/lib/guests/constants";
import type { DbGuest } from "@/types/database";
import type { Guest, GuestFormValues, IdType } from "@/types/guest";

export function isGuestArchived(row: DbGuest): boolean {
  const notes = Array.isArray(row.notes) ? row.notes : [];
  return notes.includes(GUEST_ARCHIVED_MARKER);
}

function parseNotes(notes: DbGuest["notes"]): string[] {
  if (!Array.isArray(notes)) return [];
  return notes
    .map(String)
    .filter((n) => n !== GUEST_ARCHIVED_MARKER);
}

export function mapDbGuestToGuest(row: DbGuest): Guest {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    nationality: row.nationality ?? "",
    idType: (row.id_type ?? "other") as IdType,
    idNumber: row.id_number ?? "",
    address: row.address ?? "",
    guestStatus: row.guest_status,
    totalVisits: row.total_visits,
    totalSpent: Number(row.total_spent),
    vipStatus: row.vip_status,
    notes: parseNotes(row.notes),
  };
}

export function parseNotesInput(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formValuesToGuestInsert(
  values: GuestFormValues
): Omit<DbGuest, "id" | "created_at" | "updated_at" | "total_visits" | "total_spent"> {
  return {
    full_name: values.fullName.trim(),
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    nationality: values.nationality.trim() || null,
    id_type: values.idType,
    id_number: values.idNumber.trim() || null,
    address: values.address.trim() || null,
    guest_status: "reserved",
    vip_status: values.vipStatus,
    notes: parseNotesInput(values.notes),
    document_urls: [],
  };
}

export function formValuesToGuestUpdate(
  values: GuestFormValues
): Partial<
  Pick<
    DbGuest,
    | "full_name"
    | "phone"
    | "email"
    | "nationality"
    | "id_type"
    | "id_number"
    | "address"
    | "vip_status"
    | "notes"
  >
> {
  return {
    full_name: values.fullName.trim(),
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    nationality: values.nationality.trim() || null,
    id_type: values.idType,
    id_number: values.idNumber.trim() || null,
    address: values.address.trim() || null,
    vip_status: values.vipStatus,
    notes: parseNotesInput(values.notes),
  };
}
