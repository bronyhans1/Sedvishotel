"use client";

import { useEffect, useState, useTransition } from "react";

import { updateGuestAction } from "@/features/guests/actions";
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
import type { Guest, GuestFormValues } from "@/types/guest";
import { ID_TYPE_OPTIONS } from "@/types/guest";

type Props = {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

function toForm(g: Guest): GuestFormValues {
  return {
    fullName: g.fullName,
    phone: g.phone,
    email: g.email,
    nationality: g.nationality,
    idType: g.idType,
    idNumber: g.idNumber,
    address: g.address,
    vipStatus: g.vipStatus,
    notes: g.notes.join("\n"),
  };
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EditGuestModal({
  guest,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState<GuestFormValues | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (guest) {
      setValues(toForm(guest));
      setSubmitError("");
    }
  }, [guest]);

  if (!guest || !values) return null;

  const editGuest = guest;
  const formValues = values;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {guest.fullName}</DialogTitle>
          <DialogDescription>Update guest profile details.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!formValues.fullName.trim()) {
              setSubmitError("Guest name is required.");
              return;
            }
            setSubmitError("");
            startTransition(async () => {
              const result = await updateGuestAction(editGuest.id, formValues);
              if (!result.success) {
                setSubmitError(result.error);
                toast.error(result.error);
                return;
              }
              onOpenChange(false);
              toast.celebrate("Guest Updated", `${formValues.fullName} saved.`);
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
            <Label>Full Name</Label>
            <Input
              value={values.fullName}
              onChange={(e) =>
                setValues((v) => (v ? { ...v, fullName: e.target.value } : v))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={values.phone}
                onChange={(e) =>
                  setValues((v) => (v ? { ...v, phone: e.target.value } : v))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={values.email}
                onChange={(e) =>
                  setValues((v) => (v ? { ...v, email: e.target.value } : v))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>ID Type</Label>
            <select
              value={values.idType}
              onChange={(e) =>
                setValues((v) =>
                  v
                    ? {
                        ...v,
                        idType: e.target.value as GuestFormValues["idType"],
                      }
                    : v
                )
              }
              className={selectClass}
            >
              {ID_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <Label htmlFor="vip-status">VIP Guest</Label>
              <p className="text-xs text-muted-foreground">
                Manual flag for priority service.
              </p>
            </div>
            <input
              id="vip-status"
              type="checkbox"
              checked={values.vipStatus}
              onChange={(e) =>
                setValues((v) =>
                  v ? { ...v, vipStatus: e.target.checked } : v
                )
              }
              className="h-4 w-4"
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={values.notes}
              onChange={(e) =>
                setValues((v) => (v ? { ...v, notes: e.target.value } : v))
              }
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <SubmitButton loading={isPending} loadingLabel="Saving Guest…">
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
