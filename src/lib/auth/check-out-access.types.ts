export type CheckOutAccess = {
  canView: boolean;
  canProcess: boolean;
  /** Approve / reject / waive overstay charges (check_out.manage). */
  canManageOverstay: boolean;
};
