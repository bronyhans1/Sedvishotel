import type { GroupBillingPolicy } from "@/types/group-reservation";

/**
 * Determines whether a POS room charge should post to the group's master folio
 * instead of the guest's individual folio.
 */
export function shouldRoutePosChargeToMasterFolio(
  billingPolicy: GroupBillingPolicy
): boolean {
  switch (billingPolicy) {
    case "company_pays_all":
    case "complimentary":
    case "credit":
      return true;
    case "company_pays_accommodation":
    case "guest_pays_all":
    case "guest_pays_extras":
    case "mixed_billing":
    case "deposit":
    case "pay_at_check_out":
    default:
      return false;
  }
}

export type PosFolioRoutingDecision = {
  postFolioDebitInRpc: boolean;
  targetFolioId?: string;
};
