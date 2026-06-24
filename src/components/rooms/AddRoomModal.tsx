"use client";

import { useState, useTransition } from "react";

import { createRoomAction } from "@/features/rooms/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import { isValidRoomNumber } from "@/lib/rooms/floor-layout";
import { formatRoomTypeOptionLabel } from "@/lib/rooms/room-type-options";
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
import type {
  RoomFormValues,
  RoomStatus,
  RoomTypeOption,
} from "@/types/room";
import type { FloorOption } from "@/types/floor";
import { STATUS_OPTIONS } from "@/types/room";

type AddRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomTypeOptions: RoomTypeOption[];
  floorOptions: FloorOption[];
  onSuccess?: () => void;
};

type FormErrors = Partial<Record<keyof RoomFormValues, string>>;

const initialValues: RoomFormValues = {
  roomNumber: "",
  floorId: "",
  roomTypeId: "",
  status: "available",
  notes: "",
};

function validate(values: RoomFormValues): FormErrors {
  const errors: FormErrors = {};
  const num = values.roomNumber.trim();

  if (!num) {
    errors.roomNumber = "Room number is required";
  } else if (!isValidRoomNumber(num)) {
    errors.roomNumber = "Enter a valid room number (e.g. 004, 301, Suite A1)";
  }

  if (!values.floorId) {
    errors.floorId = "Floor is required";
  }

  if (!values.roomTypeId) {
    errors.roomTypeId = "Room type is required";
  }

  if (!values.status) {
    errors.status = "Status is required";
  }

  return errors;
}

export function AddRoomModal({
  open,
  onOpenChange,
  roomTypeOptions,
  floorOptions,
  onSuccess,
}: AddRoomModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState<RoomFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClose(next: boolean) {
    if (!next) {
      setValues(initialValues);
      setErrors({});
      setSubmitError("");
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitError("");
    startTransition(async () => {
      const result = await createRoomAction(values);
      if (!result.success) {
        setSubmitError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate("Room Saved", `Room ${values.roomNumber} added.`);
      refresh();
      onSuccess?.();
    });
  }

  const selectClassName =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Room</DialogTitle>
          <DialogDescription>
            Register a new room in SEDVIS HOTEL. Assign a room type and floor
            independently.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="add-room-number">Room Number</Label>
            <Input
              id="add-room-number"
              placeholder="e.g. 036"
              value={values.roomNumber}
              onChange={(e) =>
                setValues((v) => ({ ...v, roomNumber: e.target.value }))
              }
              aria-invalid={!!errors.roomNumber}
            />
            {errors.roomNumber && (
              <p className="text-xs text-destructive">{errors.roomNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-room-type">Room Type</Label>
            <select
              id="add-room-type"
              value={values.roomTypeId}
              onChange={(e) =>
                setValues((v) => ({ ...v, roomTypeId: e.target.value }))
              }
              className={selectClassName}
              aria-invalid={!!errors.roomTypeId}
            >
              <option value="">Select room type…</option>
              {roomTypeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {formatRoomTypeOptionLabel(option)}
                </option>
              ))}
            </select>
            {errors.roomTypeId && (
              <p className="text-xs text-destructive">{errors.roomTypeId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-floor">Floor</Label>
            <select
              id="add-floor"
              value={values.floorId}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  floorId: e.target.value,
                }))
              }
              className={selectClassName}
              aria-invalid={!!errors.floorId}
            >
              <option value="">Select floor…</option>
              {floorOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {errors.floorId && (
              <p className="text-xs text-destructive">{errors.floorId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-status">Status</Label>
            <select
              id="add-status"
              value={values.status}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  status: e.target.value as RoomStatus,
                }))
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

          <div className="space-y-2">
            <Label htmlFor="add-notes">Notes</Label>
            <Textarea
              id="add-notes"
              placeholder="Optional notes..."
              value={values.notes}
              onChange={(e) =>
                setValues((v) => ({ ...v, notes: e.target.value }))
              }
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <SubmitButton loading={isPending} loadingLabel="Saving Room…">
              Add Room
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
