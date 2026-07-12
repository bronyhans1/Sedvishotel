"use client";

import { useState, useTransition } from "react";

import { createRoomTypeAction } from "@/features/room-types/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
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
import type { RoomTypeFormValues } from "@/types/room-type";

type AddRoomTypeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const initial: RoomTypeFormValues = {
  name: "",
  description: "",
  defaultPrice: 0,
  capacity: 1,
  amenities: "",
  pricingPresets: [],
};

export function AddRoomTypeModal({
  open,
  onOpenChange,
  onSuccess,
}: AddRoomTypeModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClose(next: boolean) {
    if (!next) {
      setValues(initial);
      setErrors({});
      setSubmitError("");
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Partial<Record<string, string>> = {};
    if (!values.name.trim()) next.name = "Name is required";
    if (values.defaultPrice <= 0) next.defaultPrice = "Price must be greater than 0";
    if (values.capacity < 1) next.capacity = "Capacity must be at least 1";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitError("");
    startTransition(async () => {
      const result = await createRoomTypeAction(values);
      if (!result.success) {
        setSubmitError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate("Room Type Saved", `"${values.name}" added.`);
      refresh();
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Room Type</DialogTitle>
          <DialogDescription>
            Define a new room category and pricing for SEDVIS HOTEL.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="rt-name">Name</Label>
            <Input
              id="rt-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rt-desc">Description</Label>
            <Textarea
              id="rt-desc"
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rt-price">Default Price (GHS)</Label>
              <Input
                id="rt-price"
                type="number"
                min={0}
                value={values.defaultPrice || ""}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    defaultPrice: Number(e.target.value) || 0,
                  }))
                }
              />
              {errors.defaultPrice && (
                <p className="text-xs text-destructive">{errors.defaultPrice}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt-cap">Capacity</Label>
              <Input
                id="rt-cap"
                type="number"
                min={1}
                value={values.capacity}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    capacity: Number(e.target.value) || 1,
                  }))
                }
              />
              {errors.capacity && (
                <p className="text-xs text-destructive">{errors.capacity}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rt-amenities">Amenities (comma-separated)</Label>
            <Input
              id="rt-amenities"
              placeholder="Wi-Fi, Air Conditioning, Smart TV"
              value={values.amenities}
              onChange={(e) => setValues((v) => ({ ...v, amenities: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <SubmitButton loading={isPending} loadingLabel="Creating Room Type…">
              Create Room Type
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
