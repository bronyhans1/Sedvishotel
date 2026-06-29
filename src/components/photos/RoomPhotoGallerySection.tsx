"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { PhotoGallery } from "@/components/photos/PhotoGallery";
import {
  deleteRoomPhotoAction,
  reorderRoomPhotosAction,
  setRoomPhotoCoverAction,
  uploadRoomPhotoAction,
  uploadRoomTypePhotoAction,
} from "@/features/room-photos/actions";
import { useToast } from "@/hooks/use-toast";
import {
  ROOM_PHOTO_MAX_COUNT,
  ROOM_TYPE_PHOTO_MAX_COUNT,
} from "@/lib/room-photos/constants";
import type { RoomPhoto, RoomPhotoGallery } from "@/types/room-photo";

type RoomPhotoGallerySectionProps = {
  mode: "room" | "room_type";
  roomNumber?: string;
  roomTypeSlug?: string;
  displayGallery: RoomPhotoGallery;
  roomPhotos?: RoomPhoto[];
  roomTypePhotos?: RoomPhoto[];
  canManage: boolean;
  compact?: boolean;
  onSuccess?: () => void;
};

export function RoomPhotoGallerySection({
  mode,
  roomNumber,
  roomTypeSlug,
  displayGallery,
  roomPhotos = [],
  roomTypePhotos = [],
  canManage,
  compact,
  onSuccess,
}: RoomPhotoGallerySectionProps) {
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function refresh() {
    startTransition(() => {
      router.refresh();
      onSuccess?.();
    });
  }

  async function wrapAction(
    fn: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string
  ) {
    const result = await fn();
    if (!result.success) {
      toast.error(result.error ?? "Action failed.");
      return result;
    }
    toast.success(successMessage);
    refresh();
    return result;
  }

  const isRoom = mode === "room";
  const photos = isRoom ? displayGallery.photos : roomTypePhotos;
  const source = isRoom ? displayGallery.source : roomTypePhotos.length > 0 ? "room_type" : "none";
  const maxPhotos = isRoom ? ROOM_PHOTO_MAX_COUNT : ROOM_TYPE_PHOTO_MAX_COUNT;
  const manageablePhotoIds = isRoom
    ? roomPhotos.map((p) => p.id)
    : roomTypePhotos.map((p) => p.id);

  const inheritedLabel =
    isRoom && displayGallery.inheritedFromRoomType
      ? "Showing photos from room type — upload to add room-specific images."
      : undefined;

  return (
    <PhotoGallery
      photos={photos}
      source={source}
      inheritedLabel={inheritedLabel}
      canManage={canManage}
      maxPhotos={maxPhotos}
      uploadCount={isRoom ? roomPhotos.length : roomTypePhotos.length}
      manageablePhotoIds={manageablePhotoIds}
      compact={compact}
      onUpload={async (file) => {
        const formData = new FormData();
        formData.set("file", file);
        return wrapAction(async () => {
          if (isRoom && roomNumber) {
            return uploadRoomPhotoAction(roomNumber, formData);
          }
          if (roomTypeSlug) {
            return uploadRoomTypePhotoAction(roomTypeSlug, formData);
          }
          return { success: false, error: "Missing target." };
        }, "Photo uploaded successfully.");
      }}
      onDelete={async (photoId) =>
        wrapAction(
          () =>
            deleteRoomPhotoAction(
              photoId,
              isRoom ? roomNumber : undefined,
              roomTypeSlug
            ),
          "Photo deleted successfully."
        )
      }
      onSetCover={async (photoId) =>
        wrapAction(
          () =>
            setRoomPhotoCoverAction(
              photoId,
              isRoom ? roomNumber : undefined,
              roomTypeSlug
            ),
          "Cover photo updated successfully."
        )
      }
      onReorder={
        canManage
          ? async (photoIds) =>
              wrapAction(
                () =>
                  reorderRoomPhotosAction(
                    photoIds,
                    isRoom ? roomNumber : undefined,
                    roomTypeSlug
                  ),
                "Photo order updated successfully."
              )
          : undefined
      }
    />
  );
}
