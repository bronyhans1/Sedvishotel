"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Archive, Pencil, Trash2 } from "lucide-react";

import { EditRoomTypeModal } from "@/components/room-types/EditRoomTypeModal";
import { RoomPhotoGallerySection } from "@/components/photos/RoomPhotoGallerySection";
import { RoomTypeDetailsCard } from "@/components/room-types/RoomTypeDetailsCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  archiveRoomTypeAction,
  deleteRoomTypeAction,
} from "@/features/room-types/actions";
import { useToast } from "@/hooks/use-toast";
import type { RoomTypeAccess } from "@/lib/auth/room-type-access.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RoomType } from "@/types/room-type";
import type { RoomPhoto } from "@/types/room-photo";

type RoomTypeDetailsContentProps = {
  roomType: RoomType;
  access: RoomTypeAccess;
  photos: RoomPhoto[];
};

export function RoomTypeDetailsContent({
  roomType,
  access,
  photos,
}: RoomTypeDetailsContentProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [offerArchiveOpen, setOfferArchiveOpen] = useState(false);
  const [deleteBlockMessage, setDeleteBlockMessage] = useState("");

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  function runArchive() {
    setConfirmArchiveOpen(false);
    startTransition(async () => {
      const result = await archiveRoomTypeAction(roomType.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate("Room Type Archived", `"${roomType.name}" archived.`);
      router.push("/dashboard/rooms/types");
      router.refresh();
    });
  }

  function runDelete() {
    setConfirmDeleteOpen(false);
    startTransition(async () => {
      const result = await deleteRoomTypeAction(roomType.id);
      if (!result.success) {
        if (result.code === "DELETE_BLOCKED") {
          setDeleteBlockMessage(result.error);
          setOfferArchiveOpen(true);
          toast.error(result.error);
          return;
        }
        toast.error(result.error);
        return;
      }
      toast.celebrate("Room Type Deleted", `"${roomType.name}" deleted.`);
      router.push("/dashboard/rooms/types");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/dashboard/rooms/types">
              <ArrowLeft className="h-4 w-4" />
              Back to Room Types
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{roomType.name}</h1>
          <p className="text-muted-foreground">{roomType.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {access.canEdit && (
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit Room Type
            </Button>
          )}
          {access.canDelete && (
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          {access.canArchive && roomType.status === "active" && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setConfirmArchiveOpen(true)}
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          )}
        </div>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <RoomPhotoGallerySection
            mode="room_type"
            roomTypeSlug={roomType.id}
            displayGallery={{ photos: [], source: "none" }}
            roomTypePhotos={photos}
            canManage={access.canEdit}
          />
        </CardContent>
      </Card>
      <RoomTypeDetailsCard roomType={roomType} />
      {access.canEdit && (
        <EditRoomTypeModal
          roomType={roomType}
          open={editOpen}
          onOpenChange={setEditOpen}
          photos={photos}
          onSuccess={refresh}
        />
      )}

      <ConfirmDialog
        open={confirmArchiveOpen}
        onOpenChange={setConfirmArchiveOpen}
        title="Archive room type?"
        description={`"${roomType.name}" will be marked inactive and hidden from new assignments.`}
        confirmLabel="Archive"
        loading={isPending}
        onConfirm={runArchive}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete room type?"
        description={`Permanently delete "${roomType.name}"? This only succeeds when no rooms, reservations, invoices, or payments reference it.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={isPending}
        onConfirm={runDelete}
      />

      <ConfirmDialog
        open={offerArchiveOpen}
        onOpenChange={setOfferArchiveOpen}
        title="Cannot delete room type"
        description={deleteBlockMessage}
        confirmLabel="Archive instead"
        cancelLabel="Close"
        loading={isPending}
        onConfirm={() => {
          setOfferArchiveOpen(false);
          setConfirmArchiveOpen(true);
        }}
      />
    </div>
  );
}
