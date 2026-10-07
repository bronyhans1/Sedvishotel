import type { CheckoutPolicy } from "@/types/late-checkout";

import {
  computeLateCheckoutFee,
  type LateCheckoutFeeResult,
} from "@/lib/reservations/late-checkout-fee";

export type LateCheckoutWaiverAudit = {
  originalFee: number;
  waivedAmount: number;
  originalPolicyType: "flat" | "hour_based";
};

export type LateCheckoutWaiverResolution = {
  fee: number;
  hoursLate: number;
  /** Value stored on the reservation and shown in an authorized preview. */
  policyType: LateCheckoutFeeResult["policyType"];
  complimentary: boolean;
  /** Set only when an authorized waiver is applied. */
  waiverAudit: LateCheckoutWaiverAudit | null;
};

/** Thrown when a late-checkout waiver is requested without permission. */
export class LateCheckoutWaiverForbidden extends Error {
  readonly code = "FORBIDDEN";
  readonly statusCode = 403;

  constructor() {
    super("Forbidden: missing permission check_out.waive_late_checkout");
    this.name = "LateCheckoutWaiverForbidden";
  }
}

/**
 * Authoritative policy fee is always calculated with complimentary disabled.
 * A waiver is applied only when the caller is allowed to waive.
 * Complete rejects an unauthorized request. Preview keeps the real fee.
 */
export function resolveLateCheckoutWaiver(params: {
  policy: CheckoutPolicy;
  actualCheckoutTime: string;
  roomRate: number;
  requestedComplimentary: boolean;
  canWaive: boolean;
  mode: "complete" | "preview";
}): LateCheckoutWaiverResolution {
  const authoritative = computeLateCheckoutFee({
    policy: params.policy,
    actualCheckoutTime: params.actualCheckoutTime,
    roomRate: params.roomRate,
    complimentary: false,
  });

  if (
    params.requestedComplimentary &&
    params.mode === "complete" &&
    !params.canWaive
  ) {
    throw new LateCheckoutWaiverForbidden();
  }

  const applyWaiver = params.requestedComplimentary && params.canWaive;
  if (!applyWaiver) {
    return {
      fee: authoritative.fee,
      hoursLate: authoritative.hoursLate,
      policyType: authoritative.policyType,
      complimentary: false,
      waiverAudit: null,
    };
  }

  const waived = computeLateCheckoutFee({
    policy: params.policy,
    actualCheckoutTime: params.actualCheckoutTime,
    roomRate: params.roomRate,
    complimentary: true,
  });

  const originalPolicyType = authoritative.policyType;
  if (originalPolicyType !== "flat" && originalPolicyType !== "hour_based") {
    throw new Error("Late check-out policy could not be resolved.");
  }

  return {
    fee: waived.fee,
    hoursLate: waived.hoursLate,
    policyType: waived.policyType,
    complimentary: true,
    waiverAudit: {
      originalFee: authoritative.fee,
      waivedAmount: authoritative.fee,
      originalPolicyType,
    },
  };
}

export function buildLateCheckoutActivityMetadata(input: {
  reservationNumber: string;
  guest: string;
  room: string;
  resolution: LateCheckoutWaiverResolution;
  reason: string;
  actualCheckoutTime: string;
  lateCheckoutAt: string;
}): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    reservation_number: input.reservationNumber,
    guest: input.guest,
    room: input.room,
    fee: input.resolution.fee,
    complimentary: input.resolution.complimentary,
    hours_late: input.resolution.hoursLate,
    policy_type: input.resolution.waiverAudit
      ? input.resolution.waiverAudit.originalPolicyType
      : input.resolution.policyType,
    reason: input.reason,
    actual_checkout_time: input.actualCheckoutTime,
    late_checkout_at: input.lateCheckoutAt,
  };

  if (input.resolution.waiverAudit) {
    metadata.original_fee = input.resolution.waiverAudit.originalFee;
    metadata.waived_amount = input.resolution.waiverAudit.waivedAmount;
    metadata.original_policy_type =
      input.resolution.waiverAudit.originalPolicyType;
  }

  return metadata;
}
