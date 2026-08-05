export type NightAuditAccess = {
  canView: boolean;
  /** Receptionist: close today's OPEN audit. */
  canRunAudit: boolean;
  /** Administrator: reopen a closed audit. */
  canReopen: boolean;
  /** Administrator: re-close a historical (non-today) OPEN audit. */
  canRecloseHistorical: boolean;
  /** Administrator: view immutable revision history. */
  canViewRevisions: boolean;
};
