import type { Metadata } from "next";

import { ReservationDetailsContent } from "@/features/reservations/components/ReservationDetailsContent";
import { loadReservationDetail } from "@/features/reservations/load-reservation-detail";
import { siteConfig } from "@/config/site";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { reservation } = await loadReservationDetail(id);
    return {
      title: reservation.reservationNumber,
      description: `${reservation.guestName} — ${siteConfig.name}`,
    };
  } catch {
    return { title: "Reservation Not Found" };
  }
}

export default async function ReservationDetailsPage({ params }: Props) {
  const { id } = await params;
  const { reservation, access, checkoutAccess, roomTypeOptions, checkoutPolicy } =
    await loadReservationDetail(id);
  return (
    <ReservationDetailsContent
      reservation={reservation}
      access={access}
      checkoutAccess={checkoutAccess}
      roomTypeOptions={roomTypeOptions}
      checkoutPolicy={checkoutPolicy}
    />
  );
}
