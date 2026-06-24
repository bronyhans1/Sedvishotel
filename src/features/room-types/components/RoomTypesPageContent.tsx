"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { AddRoomTypeModal } from "@/components/room-types/AddRoomTypeModal";
import { EditRoomTypeModal } from "@/components/room-types/EditRoomTypeModal";
import { RoomTypeTable } from "@/components/room-types/RoomTypeTable";
import { RoomTypesEmptyState } from "@/components/room-types/RoomTypesEmptyState";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { RoomTypesStats } from "@/features/room-types/components/RoomTypesStats";
import type { RoomTypeAccess } from "@/lib/auth/room-type-access.types";
import { siteConfig } from "@/config/site";
import type { RoomType, RoomTypeStats } from "@/types/room-type";

type RoomTypesPageContentProps = {
  roomTypes: RoomType[];
  stats: RoomTypeStats;
  access: RoomTypeAccess;
};

export function RoomTypesPageContent({
  roomTypes,
  stats,
  access,
}: RoomTypesPageContentProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editType, setEditType] = useState<RoomType | null>(null);

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <PageContainer
      title="Room Types"
      description={`Define room categories and pricing at ${siteConfig.name}.`}
      actions={
        access.canCreate ? (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Room Type
          </Button>
        ) : undefined
      }
    >
      <RoomTypesStats stats={stats} />
      {roomTypes.length === 0 ? (
        <RoomTypesEmptyState />
      ) : (
        <RoomTypeTable
          roomTypes={roomTypes}
          canEdit={access.canEdit}
          onEdit={access.canEdit ? setEditType : undefined}
        />
      )}
      {access.canCreate && (
        <AddRoomTypeModal
          open={addOpen}
          onOpenChange={setAddOpen}
          onSuccess={refresh}
        />
      )}
      {access.canEdit && (
        <EditRoomTypeModal
          roomType={editType}
          open={!!editType}
          onOpenChange={(open) => !open && setEditType(null)}
          onSuccess={refresh}
        />
      )}
    </PageContainer>
  );
}
