"use client";

import { useEffect, useState, useTransition } from "react";

import { updateRoomTypeAction } from "@/features/room-types/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
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
import { buildPricingPresetsFromRules } from "@/lib/room-types/mapper";
import { RoomTypePricingPresetsPanel } from "@/components/pricing/RoomTypePricingPresetsPanel";
import type { RoomType, RoomTypeFormValues } from "@/types/room-type";
import type { RoomPhoto } from "@/types/room-photo";

type EditRoomTypeModalProps = {
  roomType: RoomType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos?: RoomPhoto[];
  onSuccess?: () => void;
};

function toForm(type: RoomType): RoomTypeFormValues {
  return {
    name: type.name,
    description: type.description,
    defaultPrice: type.defaultPrice,
    capacity: type.capacity,
    amenities: type.amenities.join(", "),
    pricingPresets: buildPricingPresetsFromRules(type.pricingRules),
  };
}

export function EditRoomTypeModal({
  roomType,
  open,
  onOpenChange,
  photos = [],
  onSuccess,
}: EditRoomTypeModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState<RoomTypeFormValues | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (roomType) {
      setValues(toForm(roomType));
      setSubmitError("");
    }
  }, [roomType]);

  if (!roomType || !values) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {roomType.name}</DialogTitle>
          <DialogDescription>
            Update room type configuration. Changes are saved to Supabase.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitError("");
            startTransition(async () => {
              const result = await updateRoomTypeAction(roomType.id, values);
              if (!result.success) {
                setSubmitError(result.error);
                toast.error(result.error);
                return;
              }
              onOpenChange(false);
              toast.celebrate("Room Type Saved", `"${values.name}" saved.`);
              refresh();
              onSuccess?.();
            });
          }}
        >
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={values.name}
              onChange={(e) =>
                setValues((v) => (v ? { ...v, name: e.target.value } : v))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={values.description}
              onChange={(e) =>
                setValues((v) => (v ? { ...v, description: e.target.value } : v))
              }
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Rack Rate (GHS)</Label>
              <Input
                type="number"
                value={values.defaultPrice}
                onChange={(e) =>
                  setValues((v) =>
                    v ? { ...v, defaultPrice: Number(e.target.value) } : v
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input
                type="number"
                value={values.capacity}
                onChange={(e) =>
                  setValues((v) =>
                    v ? { ...v, capacity: Number(e.target.value) } : v
                  )
                }
              />
            </div>
          </div>
          <RoomTypePricingPresetsPanel
            rackRate={values.defaultPrice}
            presets={values.pricingPresets}
            onChange={(pricingPresets) =>
              setValues((v) => (v ? { ...v, pricingPresets } : v))
            }
          />
          <div className="space-y-2">
            <Label>Amenities</Label>
            <Input
              value={values.amenities}
              onChange={(e) =>
                setValues((v) => (v ? { ...v, amenities: e.target.value } : v))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Photo Gallery</Label>
            <RoomPhotoGallerySection
              mode="room_type"
              roomTypeSlug={roomType.id}
              displayGallery={{ photos: [], source: "none" }}
              roomTypePhotos={photos}
              canManage
              compact
              onSuccess={onSuccess}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <SubmitButton loading={isPending} loadingLabel="Saving Room Type…">
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
