"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Archive,
  Calendar,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { EditRoomModal } from "@/components/rooms/EditRoomModal";
import { RoomPhotoGallerySection } from "@/components/photos/RoomPhotoGallerySection";
import { RoomDetailsCard } from "@/components/rooms/RoomDetailsCard";
import { RoomStatusBadge } from "@/components/rooms/RoomStatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { archiveRoomAction, deleteRoomAction } from "@/features/rooms/actions";
import { useToast } from "@/hooks/use-toast";
import type { RoomAccess } from "@/lib/auth/room-access.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { FloorOption } from "@/types/floor";
import type { Room, RoomActivity, RoomTypeOption } from "@/types/room";
import type { RoomPhoto, RoomPhotoGallery } from "@/types/room-photo";

type RoomDetailsContentProps = {
  room: Room;
  access: RoomAccess;
  activities: RoomActivity[];
  displayGallery: RoomPhotoGallery;
  roomPhotos: RoomPhoto[];
  roomTypeOptions: RoomTypeOption[];
  floorOptions: FloorOption[];
};

export function RoomDetailsContent({
  room,
  access,
  activities,
  displayGallery,
  roomPhotos,
  roomTypeOptions,
  floorOptions,
}: RoomDetailsContentProps) {
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
      const result = await archiveRoomAction(room.roomNumber);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate("Room Archived", `Room ${room.roomNumber} archived.`);
      router.push("/dashboard/rooms");
      router.refresh();
    });
  }

  function runDelete() {
    setConfirmDeleteOpen(false);
    startTransition(async () => {
      const result = await deleteRoomAction(room.roomNumber);
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
      toast.celebrate("Room Deleted", `Room ${room.roomNumber} deleted.`);
      router.push("/dashboard/rooms");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/dashboard/rooms">
              <ArrowLeft className="h-4 w-4" />
              Back to Rooms
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Room {room.roomNumber}
            </h1>
            <p className="text-muted-foreground">
              {room.roomType} · {room.floorLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RoomStatusBadge status={room.status} />
          {(access.canEdit || access.canChangeStatus) && (
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              {access.canEdit ? "Edit Room" : "Update Status"}
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
          {access.canArchive && (
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardContent className="p-0">
            <RoomPhotoGallerySection
              mode="room"
              roomNumber={room.roomNumber}
              roomTypeSlug={room.roomTypeId}
              displayGallery={displayGallery}
              roomPhotos={roomPhotos}
              canManage={access.canEdit}
            />
          </CardContent>
        </Card>

        <RoomDetailsCard room={room} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-brand-gold" />
              Amenities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {room.amenities.length > 0 ? (
              <ul className="list-inside list-disc space-y-1 text-sm">
                {room.amenities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No amenities configured for this room type.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Activity History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <ul className="space-y-4">
                {activities.map((activity, index) => (
                  <li key={activity.id}>
                    {index > 0 && <Separator className="mb-4" />}
                    <div className="flex gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        {activity.description ? (
                          <p className="text-xs text-muted-foreground">
                            {activity.description}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground/80">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No activity recorded for this room yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {(access.canEdit || access.canChangeStatus) && (
        <EditRoomModal
          room={room}
          open={editOpen}
          onOpenChange={setEditOpen}
          roomTypeOptions={roomTypeOptions}
          floorOptions={floorOptions}
          displayGallery={displayGallery}
          roomPhotos={roomPhotos}
          canManagePhotos={access.canEdit}
          onSuccess={refresh}
          statusOnly={access.canChangeStatus && !access.canEdit}
        />
      )}

      <ConfirmDialog
        open={confirmArchiveOpen}
        onOpenChange={setConfirmArchiveOpen}
        title="Archive room?"
        description={`Archive room ${room.roomNumber}? It will be marked for maintenance and hidden from active operations.`}
        confirmLabel="Archive"
        loading={isPending}
        onConfirm={runArchive}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete room?"
        description={`Permanently delete room ${room.roomNumber}? This only succeeds when no reservation history exists.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={isPending}
        onConfirm={runDelete}
      />

      <ConfirmDialog
        open={offerArchiveOpen}
        onOpenChange={setOfferArchiveOpen}
        title="Cannot delete room"
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
