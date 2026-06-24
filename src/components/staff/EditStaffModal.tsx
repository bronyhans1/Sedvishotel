"use client";

import { useEffect, useState } from "react";

import {
  StaffAvatarField,
  type AvatarFieldState,
} from "@/components/staff/StaffAvatarField";
import { StaffFormFields } from "@/components/staff/StaffFormFields";
import { SubmitButton } from "@/components/loading/SubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StaffFormValues, StaffMember, UpdateStaffInput } from "@/types/staff";

const emptyAvatar: AvatarFieldState = { file: null, removeExisting: false };

type Props = {
  member: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    member: StaffMember,
    input: UpdateStaffInput,
    avatar: AvatarFieldState
  ) => void;
  pending?: boolean;
};

function toForm(m: StaffMember): StaffFormValues {
  return {
    fullName: m.fullName,
    email: m.email,
    phone: m.phone,
    role: m.role,
    department: m.department,
    status: m.status,
  };
}

export function EditStaffModal({ member, open, onOpenChange, onSave, pending }: Props) {
  const [values, setValues] = useState<StaffFormValues | null>(null);
  const [avatar, setAvatar] = useState<AvatarFieldState>(emptyAvatar);

  useEffect(() => {
    if (member) {
      setValues(toForm(member));
      setAvatar(emptyAvatar);
    }
  }, [member]);

  if (!member || !values) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(member, values, avatar);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {member.fullName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <StaffAvatarField
            fullName={values.fullName}
            currentAvatarUrl={member.avatarUrl}
            value={avatar}
            onChange={setAvatar}
            disabled={pending}
          />
          <div className="mt-4">
            <StaffFormFields values={values} onChange={setValues} showStatus />
          </div>
          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton loading={pending} loadingLabel="Saving Staff…">
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
