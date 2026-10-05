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

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function ReservationsPageLoader({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadReservationsPageData(params);
  return <ReservationsPageContent {...data} />;
}

export default function ReservationsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<ReservationsPageSkeleton />}>
      <ReservationsPageLoader searchParams={searchParams} />
    </Suspense>
  );
}
