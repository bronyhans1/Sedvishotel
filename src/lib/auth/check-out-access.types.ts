export type CheckOutAccess = {
  canView: boolean;
  canProcess: boolean;
  /** Approve / reject / waive overstay charges (check_out.manage). */
  canManageOverstay: boolean;
  /** Waive a calculated late check-out fee (check_out.waive_late_checkout). */
  canWaiveLateCheckout: boolean;
};
