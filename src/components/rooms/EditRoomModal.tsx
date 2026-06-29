"use client";

import { useEffect, useState, useTransition } from "react";

import {
  changeRoomStatusAction,
  updateRoomAction,
} from "@/features/rooms/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import { formatRoomTypeOptionLabel } from "@/lib/rooms/room-type-options";
import { RoomPhotoGallerySection } from "@/components/photos/RoomPhotoGallerySection";
import { SubmitButton } from "@/components/loading/SubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Room, RoomFormValues, RoomTypeOption } from "@/types/room";
import type { RoomPhoto, RoomPhotoGallery } from "@/types/room-photo";
import type { FloorOption } from "@/types/floor";
import { STATUS_OPTIONS } from "@/types/room";

type EditRoomModalProps = {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomTypeOptions: RoomTypeOption[];
  floorOptions: FloorOption[];
  displayGallery?: RoomPhotoGallery;
  roomPhotos?: RoomPhoto[];
  canManagePhotos?: boolean;
  onSuccess?: () => void;
  /** Housekeeping: status field only */
  statusOnly?: boolean;
};

function roomToForm(room: Room): RoomFormValues {
  return {
    roomNumber: room.roomNumber,
    floorId: room.floorId,
    roomTypeId: room.roomTypeId,
    status: room.status,
    notes: room.notes ?? "",
  };
}

export function EditRoomModal({
  room,
  open,
  onOpenChange,
  roomTypeOptions,
  floorOptions,
  displayGallery,
  roomPhotos = [],
  canManagePhotos = false,
  onSuccess,
  statusOnly = false,
}: EditRoomModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState<RoomFormValues | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (room) {
      setValues(roomToForm(room));
      setSubmitError("");
    }
  }, [room]);

  if (!room || !values) {
    return null;
  }

  const editRoom = room;
  const formValues = values;

  const selectClassName =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = formValues;
    const current = editRoom;
    setSubmitError("");

    if (!statusOnly && !form.roomTypeId) {
      setSubmitError("Room type is required.");
      return;
    }

    if (!statusOnly && !form.floorId) {
      setSubmitError("Floor is required.");
      return;
    }

    startTransition(async () => {
      if (statusOnly) {
        if (form.status === current.status) {
          onOpenChange(false);
          return;
        }
        const result = await changeRoomStatusAction(
          current.roomNumber,
          form.status
        );
        if (!result.success) {
          setSubmitError(result.error);
          toast.error(result.error);
          return;
        }
        toast.celebrate(
          "Room Updated",
          `Room ${current.roomNumber} status updated.`
        );
      } else {
        const result = await updateRoomAction(current.roomNumber, form);
        if (!result.success) {
          setSubmitError(result.error);
          toast.error(result.error);
          return;
        }
        toast.celebrate("Room Saved", `Room ${current.roomNumber} saved.`);
      }
      onOpenChange(false);
      refresh();
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {statusOnly ? `Update Status — Room ${room.roomNumber}` : `Edit Room ${room.roomNumber}`}
          </DialogTitle>
          <DialogDescription>
            {statusOnly
              ? "Change operational status for this room."
              : "Update room details. Room type and floor are saved independently."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          {!statusOnly && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-room-number">Room Number</Label>
                <Input
                  id="edit-room-number"
                  value={values.roomNumber}
                  onChange={(e) =>
                    setValues((v) =>
                      v ? { ...v, roomNumber: e.target.value } : v
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-room-type">Room Type</Label>
                <select
                  id="edit-room-type"
                  value={values.roomTypeId}
                  onChange={(e) =>
                    setValues((v) =>
                      v ? { ...v, roomTypeId: e.target.value } : v
                    )
                  }
                  className={selectClassName}
                >
                  <option value="">Select room type…</option>
                  {roomTypeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {formatRoomTypeOptionLabel(option)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-floor">Floor</Label>
                <select
                  id="edit-floor"
                  value={values.floorId}
                  onChange={(e) =>
                    setValues((v) =>
                      v ? { ...v, floorId: e.target.value } : v
                    )
                  }
                  className={selectClassName}
                >
                  <option value="">Select floor…</option>
                  {floorOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <select
              id="edit-status"
              value={values.status}
              onChange={(e) =>
                setValues((v) =>
                  v
                    ? {
                        ...v,
                        status: e.target.value as RoomFormValues["status"],
                      }
                    : v
                )
              }
              className={selectClassName}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {!statusOnly && (
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={values.notes}
                onChange={(e) =>
                  setValues((v) => (v ? { ...v, notes: e.target.value } : v))
                }
                rows={3}
              />
            </div>
          )}

          {!statusOnly && (
            <div className="space-y-2">
              <Label>Room Photos</Label>
              {displayGallery ? (
                <RoomPhotoGallerySection
                  mode="room"
                  roomNumber={editRoom.roomNumber}
                  roomTypeSlug={editRoom.roomTypeId}
                  displayGallery={displayGallery}
                  roomPhotos={roomPhotos}
                  canManage={canManagePhotos}
                  compact
                  onSuccess={onSuccess}
                />
              ) : null}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <SubmitButton loading={isPending} loadingLabel="Saving Room…">
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
