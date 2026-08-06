/**
 * Standard wording for system-generated notes when migrations or operational
 * repair jobs automatically heal data. Use these constants in future heal
 * migrations so audit history stays consistent and searchable.
 *
 * Do not rewrite already-applied production history; apply only going forward.
 */
export const SYSTEM_HEAL_NOTES = {
  NIGHT_AUDIT_SINGLE_OPEN:
    "Automatically closed during Night Audit Lifecycle migration to enforce the single OPEN Business Day rule.",
  BUSINESS_DATE_ENGINE_INIT:
    "Initialized by Business Date Engine Phase 2 migration.",
  OPERATIONAL_INTEGRITY_MIGRATION:
    "Automatically corrected by SHMS operational integrity migration.",
  SHIFT_HANDOVER_BUSINESS_DATE_BACKFILL:
    "Automatically corrected by SHMS operational integrity migration (shift handover business_date backfill).",
  CORRECTION_SESSION_ORPHAN_HEAL:
    "Automatically corrected by SHMS operational integrity migration (orphan correction session).",
  ARRIVAL_LIFECYCLE_RECONCILE:
    "Room status reconciled by Reservation Arrival Lifecycle against current Business Date.",
} as const;

export type SystemHealNoteKey = keyof typeof SYSTEM_HEAL_NOTES;
