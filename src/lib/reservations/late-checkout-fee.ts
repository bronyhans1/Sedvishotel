import { timeToMinutes } from "@/lib/dates/time";
import { roundCurrency } from "@/lib/payments/currency";
import type { CheckoutPolicy, LateCheckoutPolicyMode } from "@/types/late-checkout";

export type LateCheckoutFeeResult = {
  fee: number;
  hoursLate: number;
  policyType: LateCheckoutPolicyMode | "complimentary";
};

export function computeHoursLate(
  policyCheckOutTime: string,
  actualCheckoutTime: string
): number {
  const minutes = timeToMinutes(actualCheckoutTime) - timeToMinutes(policyCheckOutTime);
  if (minutes <= 0) return 0;
  return Math.round((minutes / 60) * 100) / 100;
}

export function computeLateCheckoutFee(params: {
  policy: CheckoutPolicy;
  actualCheckoutTime: string;
  roomRate: number;
  complimentary?: boolean;
}): LateCheckoutFeeResult {
  const hoursLate = computeHoursLate(
    params.policy.checkOutTime,
    params.actualCheckoutTime
  );

  if (params.complimentary) {
    return { fee: 0, hoursLate, policyType: "complimentary" };
  }

  if (params.policy.lateCheckoutPolicyMode === "flat") {
    return {
      fee: roundCurrency(params.policy.lateCheckoutFee),
      hoursLate,
      policyType: "flat",
    };
  }

  let fee: number;
  if (hoursLate <= 2) {
    fee = params.policy.hourFee1To2;
  } else if (hoursLate <= 4) {
    fee = params.policy.hourFee2To4;
  } else if (hoursLate <= 6) {
    fee = params.policy.hourFee4To6;
  } else {
    fee = params.roomRate;
  }

  return {
    fee: roundCurrency(fee),
    hoursLate,
    policyType: "hour_based",
  };
}

export function lateCheckoutPolicyLabel(
  policyType: LateCheckoutFeeResult["policyType"]
): string {
  switch (policyType) {
    case "flat":
      return "Flat Fee";
    case "hour_based":
      return "Hour-Based";
    case "complimentary":
      return "Complimentary";
    default:
      return policyType;
  }
}
