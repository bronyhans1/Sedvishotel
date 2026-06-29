"use client";

import { useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateStaffFormValues, CreateStaffInput } from "@/types/staff";

const emptyAvatar: AvatarFieldState = { file: null, removeExisting: false };

const emptyForm: CreateStaffFormValues = {
  fullName: "",
  email: "",
  phone: "",
  role: "receptionist",
  department: "Front Desk",
  status: "active",
  employeeId: "",
  temporaryPassword: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateStaffInput, avatarFile?: File) => void;
  pending?: boolean;
};

export function CreateStaffModal({ open, onOpenChange, onCreate, pending }: Props) {
  const [values, setValues] = useState<CreateStaffFormValues>(emptyForm);
  const [avatar, setAvatar] = useState<AvatarFieldState>(emptyAvatar);
  const [formError, setFormError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!values.fullName.trim()) {
      setFormError("Full name is required.");
      return;
    }
    if (!values.email.trim()) {
      setFormError("Email is required.");
      return;
    }
    if (!values.employeeId.trim()) {
      setFormError("Employee ID is required.");
      return;
    }
    if (!values.temporaryPassword.trim()) {
      setFormError("Temporary password is required.");
      return;
    }
    if (values.temporaryPassword.length < 8) {
      setFormError("Temporary password must be at least 8 characters.");
      return;
    }

    onCreate(
      {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        role: values.role,
        department: values.department.trim(),
        employeeId: values.employeeId.trim(),
        temporaryPassword: values.temporaryPassword,
      },
      avatar.file ?? undefined
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setValues(emptyForm);
      setAvatar(emptyAvatar);
      setFormError("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <StaffAvatarField
            fullName={values.fullName}
            value={avatar}
            onChange={setAvatar}
            disabled={pending}
          />
          <div className="mt-4">
            <StaffFormFields
              values={values}
              onChange={(next) => setValues((prev) => ({ ...prev, ...next }))}
              showStatus={false}
            />
          </div>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={values.employeeId}
                onChange={(e) =>
                  setValues((v) => ({ ...v, employeeId: e.target.value }))
                }
                placeholder="EMP-2026-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temporaryPassword">Temporary Password</Label>
              <Input
                id="temporaryPassword"
                type="password"
                value={values.temporaryPassword}
                onChange={(e) =>
                  setValues((v) => ({ ...v, temporaryPassword: e.target.value }))
                }
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Staff must change this password on first login.
              </p>
            </div>
          </div>
          {formError ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton loading={pending} loadingLabel="Creating Staff…">
              Create Staff
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
