"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Pencil,
  Phone,
  User,
} from "lucide-react";

import type { AvatarFieldState } from "@/components/staff/StaffAvatarField";
import { EditStaffModal } from "@/components/staff/EditStaffModal";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { StaffRoleBadge } from "@/components/staff/StaffRoleBadge";
import { StaffStatusBadge } from "@/components/staff/StaffStatusBadge";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { PermissionGroupsCard } from "@/components/permissions/PermissionGroupsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  removeStaffAvatarAction,
  updateStaffAction,
  uploadStaffAvatarAction,
} from "@/features/staff/actions";
import type { StaffAccess } from "@/lib/auth/staff-access";
import type { ActivityLog } from "@/types/log";
import type { StaffMember, UpdateStaffInput } from "@/types/staff";

type Props = {
  member: StaffMember;
  access: StaffAccess;
  permissionCount: number;
  permissionCodes: string[];
  activity: ActivityLog[];
};

export function StaffDetailsContent({
  member: initial,
  access,
  permissionCount,
  permissionCodes,
  activity,
}: Props) {
  const toast = useToast();
  const [member, setMember] = useState(initial);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = (
    current: StaffMember,
    input: UpdateStaffInput,
    avatar: AvatarFieldState
  ) => {
    setError("");
    startTransition(async () => {
      const result = await updateStaffAction(current.id, input);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      let avatarUrl = current.avatarUrl;

      if (avatar.file) {
        const formData = new FormData();
        formData.set("avatar", avatar.file);
        const upload = await uploadStaffAvatarAction(current.id, formData);
        if (!upload.success) {
          setError(upload.error);
          toast.error(upload.error);
          return;
        }
        avatarUrl = URL.createObjectURL(avatar.file);
      } else if (avatar.removeExisting) {
        const removed = await removeStaffAvatarAction(current.id);
        if (!removed.success) {
          setError(removed.error);
          toast.error(removed.error);
          return;
        }
        avatarUrl = undefined;
      }

      setMember({ ...current, ...input, avatarUrl });
      setEditOpen(false);
      toast.celebrate("Staff Updated", `${current.fullName} profile saved.`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/dashboard/staff">
              <ArrowLeft className="h-4 w-4" />
              Back to Staff
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <StaffAvatar
              fullName={member.fullName}
              avatarUrl={member.avatarUrl}
              className="h-16 w-16"
              fallbackClassName="text-lg"
            />
            <h1 className="text-3xl font-bold">{member.fullName}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <StaffRoleBadge role={member.role} />
            <StaffStatusBadge status={member.status} />
          </div>
        </div>
        {access.canManage ? (
          <Button size="sm" onClick={() => setEditOpen(true)} disabled={isPending}>
            <Pencil className="h-4 w-4" />
            Edit Staff
          </Button>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {member.email}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {member.phone}
            </div>
            <Separator />
            <p className="text-muted-foreground">Employee ID</p>
            <p className="font-mono text-xs">{member.employeeId}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium">{member.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date Joined</span>
              <span>{member.dateJoined}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Login</span>
              <span>{member.lastLogin}</span>
            </div>
          </CardContent>
        </Card>

        <PermissionGroupsCard
          permissionCount={permissionCount}
          permissionCodes={permissionCodes}
          className="lg:col-span-2"
        />

        <ActivityTimeline activity={activity} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {member.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes on file</p>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-sm">
              {member.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {access.canManage ? (
        <EditStaffModal
          member={member}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSave={handleSave}
          pending={isPending}
        />
      ) : null}
    </div>
  );
}
