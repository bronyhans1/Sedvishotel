import type { Metadata } from "next";

import { GuestDetailsContent } from "@/features/guests/components/GuestDetailsContent";
import { loadGuestDetail } from "@/features/guests/load-guest-detail";
import { siteConfig } from "@/config/site";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { guest } = await loadGuestDetail(id);
    return {
      title: guest.fullName,
      description: `${guest.fullName} — ${siteConfig.name}`,
    };
  } catch {
    return { title: "Guest Not Found" };
  }
}

export default async function GuestDetailsPage({ params }: Props) {
  const { id } = await params;
  const { guest, access, guestReservations } = await loadGuestDetail(id);
  return (
    <GuestDetailsContent
      guest={guest}
      access={access}
      guestReservations={guestReservations}
    />
  );
}
