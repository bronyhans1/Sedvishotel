import type { Metadata } from "next";
import { Suspense } from "react";

import { GroupReservationsPageContent } from "@/features/group-reservations/components/GroupReservationsPageContent";
import { loadGroupReservationsPageData } from "@/features/group-reservations/load-group-pages";

export const metadata: Metadata = {
  title: "Group Reservations",
};

async function GroupReservationsLoader() {
  const data = await loadGroupReservationsPageData();
  return (
    <GroupReservationsPageContent
      groups={data.groups}
      access={data.access}
      corporateAccounts={data.corporateAccounts}
    />
  );
}

export default function GroupReservationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading groups…</div>}>
      <GroupReservationsLoader />
    </Suspense>
  );
}
