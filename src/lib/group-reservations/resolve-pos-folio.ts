import type { IGroupReservationRepository } from "@/repositories/group-reservation.repository";
import type { IGuestFolioRepository } from "@/repositories/guest-folio.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import {
  shouldRoutePosChargeToMasterFolio,
  type PosFolioRoutingDecision,
} from "@/lib/group-reservations/pos-billing-routing";
import { mapDbGroupReservationToGroupReservation } from "@/lib/group-reservations/mapper";

export async function resolvePosFolioRouting(
  deps: {
    reservations: IReservationRepository;
    groups: IGroupReservationRepository;
    folios: IGuestFolioRepository;
  },
  reservationId: string
): Promise<PosFolioRoutingDecision> {
  const reservation = await deps.reservations.getById(reservationId);
  if (!reservation?.group_reservation_id) {
    return { postFolioDebitInRpc: true };
  }

  const groupRow = await deps.groups.getById(reservation.group_reservation_id);
  if (!groupRow) {
    return { postFolioDebitInRpc: true };
  }

  const group = mapDbGroupReservationToGroupReservation(groupRow);
  if (!shouldRoutePosChargeToMasterFolio(group.billingPolicy)) {
    return { postFolioDebitInRpc: true };
  }

  if (!group.masterReservationId) {
    return { postFolioDebitInRpc: true };
  }

  const masterFolio = await deps.folios.getByReservationId(group.masterReservationId);
  if (!masterFolio) {
    return { postFolioDebitInRpc: true };
  }

  return {
    postFolioDebitInRpc: false,
    targetFolioId: masterFolio.id,
  };
}
