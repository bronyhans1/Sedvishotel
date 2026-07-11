import { Suspense } from "react";

import { ShiftHandoverDetailContent } from "@/features/shift-handover/components/ShiftHandoverDetailContent";
import { loadShiftHandoverDetail } from "@/features/shift-handover/load-shift-handover-detail";

type ShiftHandoverDetailPageProps = {
  params: Promise<{ ref: string }>;
};

export default async function ShiftHandoverDetailPage({
  params,
}: ShiftHandoverDetailPageProps) {
  const { ref } = await params;
  const data = await loadShiftHandoverDetail(ref);

  return (
    <Suspense>
      <ShiftHandoverDetailContent
        shift={data.shift}
        pendingTasks={data.pendingTasks}
        openIssues={data.openIssues}
        access={data.access}
      />
    </Suspense>
  );
}
