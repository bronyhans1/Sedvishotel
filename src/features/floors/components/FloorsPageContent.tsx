"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { AddFloorModal } from "@/components/floors/AddFloorModal";
import { EditFloorModal } from "@/components/floors/EditFloorModal";
import { FloorTable } from "@/components/floors/FloorTable";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { FloorsStats } from "@/features/floors/components/FloorsStats";
import type { FloorAccess } from "@/lib/auth/floor-access.types";
import { siteConfig } from "@/config/site";
import type { Floor, FloorStats } from "@/types/floor";

type FloorsPageContentProps = {
  floors: Floor[];
  stats: FloorStats;
  access: FloorAccess;
};

export function FloorsPageContent({ floors, stats, access }: FloorsPageContentProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editFloor, setEditFloor] = useState<Floor | null>(null);

  const nextDisplayOrder =
    floors.reduce((max, f) => Math.max(max, f.displayOrder), 0) + 1;

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <PageContainer
      title="Floors"
      description={`Manage floors, wings, and building sections at ${siteConfig.name}.`}
      actions={
        access.canCreate ? (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Floor
          </Button>
        ) : undefined
      }
    >
      <FloorsStats stats={stats} />
      <FloorTable
        floors={floors}
        canEdit={access.canEdit}
        onEdit={access.canEdit ? setEditFloor : undefined}
      />
      {access.canCreate && (
        <AddFloorModal
          open={addOpen}
          onOpenChange={setAddOpen}
          nextDisplayOrder={nextDisplayOrder}
          onSuccess={refresh}
        />
      )}
      {access.canEdit && (
        <EditFloorModal
          floor={editFloor}
          open={!!editFloor}
          onOpenChange={(open) => !open && setEditFloor(null)}
          onSuccess={refresh}
        />
      )}
    </PageContainer>
  );
}
