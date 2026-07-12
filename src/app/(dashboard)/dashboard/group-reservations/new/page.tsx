import type { Metadata } from "next";
import { Suspense } from "react";

import { GroupBookingWizard } from "@/features/group-reservations/components/GroupBookingWizard";
import { loadGroupWizardData } from "@/features/group-reservations/load-group-pages";

export const metadata: Metadata = {
  title: "Create Group Reservation",
};

async function WizardLoader() {
  const options = await loadGroupWizardData();
  return <GroupBookingWizard options={options} />;
}

export default function NewGroupReservationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading wizard…</div>}>
      <WizardLoader />
    </Suspense>
  );
}
