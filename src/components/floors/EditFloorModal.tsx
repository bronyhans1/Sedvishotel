"use client";

import { useEffect, useState, useTransition } from "react";

import { updateFloorAction } from "@/features/floors/actions";
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
import type { Floor, FloorFormValues } from "@/types/floor";

type EditFloorModalProps = {
  floor: Floor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

function floorToForm(floor: Floor): FloorFormValues {
  return {
    name: floor.name,
    displayOrder: floor.displayOrder,
    description: floor.description,
  };
}

export function EditFloorModal({
  floor,
  open,
  onOpenChange,
  onSuccess,
}: EditFloorModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState<FloorFormValues | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (floor) {
      setValues(floorToForm(floor));
      setSubmitError("");
    }
  }, [floor]);

  if (!floor || !values) return null;

  const editFloor = floor;
  const formValues = values;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValues.name.trim()) {
      setSubmitError("Name is required.");
      return;
    }
    const floorId = editFloor.id;
    const payload = formValues;
    setSubmitError("");
    startTransition(async () => {
      const result = await updateFloorAction(floorId, payload);
      if (!result.success) {
        setSubmitError(result.error);
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      toast.celebrate("Floor Saved", `"${payload.name}" saved.`);
      refresh();
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {floor.name}</DialogTitle>
          <DialogDescription>Update floor details and display order.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="edit-floor-name">Name</Label>
            <Input
              id="edit-floor-name"
              value={values.name}
              onChange={(e) => setValues((v) => (v ? { ...v, name: e.target.value } : v))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-floor-order">Display Order</Label>
            <Input
              id="edit-floor-order"
              type="number"
              min={1}
              value={values.displayOrder}
              onChange={(e) =>
                setValues((v) =>
                  v ? { ...v, displayOrder: Number(e.target.value) } : v
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-floor-description">Description</Label>
            <Textarea
              id="edit-floor-description"
              value={values.description}
              onChange={(e) =>
                setValues((v) => (v ? { ...v, description: e.target.value } : v))
              }
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <SubmitButton loading={isPending} loadingLabel="Saving…">
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
