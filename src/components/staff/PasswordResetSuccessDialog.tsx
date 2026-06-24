"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { StaffMember } from "@/types/staff";

type PasswordResetSuccessDialogProps = {
  member: StaffMember | null;
  password: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateNew: (profileId: string) => Promise<string | null>;
};

export function PasswordResetSuccessDialog({
  member,
  password,
  open,
  onOpenChange,
  onGenerateNew,
}: PasswordResetSuccessDialogProps) {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState(password);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setCurrentPassword(password);
    }
  }, [open, password]);

  function handleOpenChange(next: boolean) {
    if (next) {
      setCurrentPassword(password);
    }
    onOpenChange(next);
  }

  function handleCopy() {
    if (!currentPassword) return;
    void navigator.clipboard.writeText(currentPassword).then(() => {
      toast.success("Copied ✓");
    });
  }

  function handleGenerateNew() {
    if (!member) return;
    startTransition(async () => {
      const nextPassword = await onGenerateNew(member.id);
      if (nextPassword) {
        setCurrentPassword(nextPassword);
      }
    });
  }

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Temporary Password Generated</DialogTitle>
          <DialogDescription>
            Share this password securely with {member.fullName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Password</p>
          <p className="rounded-lg border bg-muted/40 px-4 py-3 font-mono text-lg font-semibold tracking-wide">
            {currentPassword}
          </p>
          <p className="text-xs text-muted-foreground">
            This password remains visible until you close this dialog.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateNew} disabled={isPending}>
              <RefreshCw className="h-4 w-4" />
              {isPending ? "Generating…" : "Generate New Password"}
            </Button>
            <Button onClick={handleCopy} disabled={!currentPassword}>
              <Copy className="h-4 w-4" />
              Copy Password
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
