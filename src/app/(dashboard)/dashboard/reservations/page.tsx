import type { Metadata } from "next";
import { Suspense } from "react";

import { ReservationsPageContent } from "@/features/reservations/components/ReservationsPageContent";
import { ReservationsPageSkeleton } from "@/features/reservations/components/ReservationsPageSkeleton";
import { loadReservationsPageData } from "@/features/reservations/load-reservations-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Reservations",
  description: `Reservation management for ${siteConfig.name}`,
};

async function ReservationsPageLoader() {
  const data = await loadReservationsPageData();
  return <ReservationsPageContent {...data} />;
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<ReservationsPageSkeleton />}>
      <ReservationsPageLoader />
    </Suspense>
  );
}
