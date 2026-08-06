import { mapDbReservationToReservation } from "@/lib/reservations/mapper";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { AuthSession } from "@/services/auth.service";
import type { GuestFolioService } from "@/services/guest-folio.service";
import type { OverstayService } from "@/services/overstay.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import type {
  OverstayCheckoutPrepareResult,
  OverstayCheckoutValidation,
  OverstayRecoveryResult,
} from "@/types/overstay-checkout";
import { validateOverstayCheckout } from "@/lib/reservations/overstay-checkout-validation";

/**
 * Overstay Checkout Coordinator (v2.4.1).
 * Validates operational state before checkout — does not calculate charges.
 * Recovery delegates to OverstayService.recoverReservationEvaluation.
 */
export class OverstayCheckoutCoordinator {
  constructor(
    private readonly reservations: IReservationRepository,
    private readonly overstays: OverstayService,
    private readonly folios: GuestFolioService
  ) {}

  async prepareCheckout(
    _ctx: ServiceContext,
    _session: AuthSession,
    reservationId: string,
    businessDate: string,
    options: {
      canManageOverstay: boolean;
      canRecordPayment: boolean;
    }
  ): Promise<OverstayCheckoutPrepareResult> {
    const validation = await this.validateForReservation(
      reservationId,
      businessDate,
      options.canManageOverstay
    );

    return {
      validation,
      canManageOverstay: options.canManageOverstay,
      canRecordPayment: options.canRecordPayment,
    };
  }

  async validateForReservation(
    reservationId: string,
    businessDate: string,
    canManageOverstay: boolean
  ): Promise<OverstayCheckoutValidation> {
    const row = await this.reservations.getById(reservationId);
    if (!row) {
      throw new ServiceError("Reservation not found.", "NOT_FOUND", 404);
    }

    const reservation = mapDbReservationToReservation(row);
    const policy = await loadCheckoutPolicy();
    const ledgerCharge = await this.overstays.getChargeForBusinessDate(
      reservationId,
      businessDate
    );
    const folioSourceReferences =
      await this.folios.listSourceReferencesForReservation(reservationId);

    return validateOverstayCheckout({
      reservationId,
      status: reservation.status,
      checkInDate: reservation.checkInDate,
      scheduledCheckOutDate: reservation.checkOutDate,
      businessDate,
      policyCheckOutTime: policy.checkOutTime,
      currentPolicy: policy.overstay,
      ledgerChargeForBusinessDate: ledgerCharge,
      folioSourceReferences,
      canManageOverstay,
    });
  }

  async assertCheckoutAllowed(
    validation: OverstayCheckoutValidation
  ): Promise<void> {
    if (!validation.isOverstay) return;
    if (!validation.checkoutAllowed && validation.checkoutBlockedReason) {
      throw new ServiceError(validation.checkoutBlockedReason, "VALIDATION", 400);
    }
  }

  async recoverMissingCharge(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    businessDate: string,
    canManageOverstay: boolean
  ): Promise<OverstayRecoveryResult> {
    const validation = await this.validateForReservation(
      reservationId,
      businessDate,
      canManageOverstay
    );

    if (!validation.recoveryAvailable) {
      throw new ServiceError(
        validation.recoveryReason ??
          "Recovery evaluation is not available for this reservation.",
        "VALIDATION",
        400
      );
    }

    const policy = await loadCheckoutPolicy();
    const { outcome } = await this.overstays.recoverReservationEvaluation(
      ctx,
      session,
      reservationId,
      businessDate,
      { policyCheckOutTime: policy.checkOutTime }
    );

    await this.folios.syncReservationSettlement(reservationId);

    const refreshed = await this.validateForReservation(
      reservationId,
      businessDate,
      canManageOverstay
    );

    return { outcome, validation: refreshed };
  }
}
