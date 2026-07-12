import type { Metadata } from "next";
import { Suspense } from "react";

import { GroupDetailPageContent } from "@/features/group-reservations/components/GroupDetailPageContent";
import { loadGroupDetailPageData } from "@/features/group-reservations/load-group-pages";

export const metadata: Metadata = {
  title: "Group Reservation Detail",
};

async function GroupDetailLoader({
  id,
  tab,
}: {
  id: string;
  tab?: string;
}) {
  const data = await loadGroupDetailPageData(id);
  return <GroupDetailPageContent data={data} initialTab={tab} />;
}

export default async function GroupReservationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading group…</div>}>
      <GroupDetailLoader id={id} tab={tab} />
    </Suspense>
  );
}
