"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { CreateStaffModal } from "@/components/staff/CreateStaffModal";
import { EditStaffModal } from "@/components/staff/EditStaffModal";
import { PasswordResetSuccessDialog } from "@/components/staff/PasswordResetSuccessDialog";
import { StaffTable } from "@/components/staff/StaffTable";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StaffStatsGrid } from "@/features/staff/components/StaffStats";
import type { AvatarFieldState } from "@/components/staff/StaffAvatarField";
import {
  activateStaffAction,
  createStaffAction,
  removeStaffAvatarAction,
  resetStaffPasswordAction,
  suspendStaffAction,
  updateStaffAction,
  uploadStaffAvatarAction,
} from "@/features/staff/actions";
import { filterStaff } from "@/features/staff/lib/filter-staff";
import { useSyncedProp } from "@/hooks/use-synced-prop";
import { useToast } from "@/hooks/use-toast";
import type { StaffAccess } from "@/lib/auth/staff-access";
import { siteConfig } from "@/config/site";
import {
  STAFF_ROLE_OPTIONS,
  STAFF_STATUS_OPTIONS,
  type CreateStaffInput,
  type StaffMember,
  type StaffRole,
  type StaffStats,
  type StaffStatus,
  type UpdateStaffInput,
} from "@/types/staff";

const selectClass =
  "h-9 w-full min-w-[140px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-auto";

type Props = {
  staff: StaffMember[];
  stats: StaffStats;
  access: StaffAccess;
};

export function StaffPageContent({ staff: initialStaff, stats, access }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [staff, setStaff] = useSyncedProp(initialStaff);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<StaffRole | "all">("all");
  const [status, setStatus] = useState<StaffStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [resetMember, setResetMember] = useState<StaffMember | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => filterStaff(staff, search, role, status),
    [staff, search, role, status]
  );

  const uploadAvatar = async (profileId: string, file: File) => {
    const formData = new FormData();
    formData.set("avatar", file);
    return uploadStaffAvatarAction(profileId, formData);
  };

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleCreate = (input: CreateStaffInput, avatarFile?: File) => {
    startTransition(async () => {
      const result = await createStaffAction(input);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (avatarFile && result.profileId) {
        const upload = await uploadAvatar(result.profileId, avatarFile);
        if (!upload.success) {
          toast.error(upload.error);
          return;
        }
      }

      if (result.member) {
        setStaff((prev) => {
          if (prev.some((s) => s.id === result.member!.id)) return prev;
          return [...prev, result.member!];
        });
      }

      setCreateOpen(false);
      toast.celebrate(
        "Staff Created",
        result.temporaryPassword
          ? `Staff created. Temporary password: ${result.temporaryPassword}`
          : "Staff member created."
      );
      refresh();
    });
  };

  const handleSave = (
    member: StaffMember,
    input: UpdateStaffInput,
    avatar: AvatarFieldState
  ) => {
    startTransition(async () => {
      const result = await updateStaffAction(member.id, input);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      let avatarUrl = member.avatarUrl;

      if (avatar.file) {
        const upload = await uploadAvatar(member.id, avatar.file);
        if (!upload.success) {
          toast.error(upload.error);
          return;
        }
        avatarUrl = URL.createObjectURL(avatar.file);
      } else if (avatar.removeExisting) {
        const removed = await removeStaffAvatarAction(member.id);
        if (!removed.success) {
          toast.error(removed.error);
          return;
        }
        avatarUrl = undefined;
      }

      setStaff((prev) =>
        prev.map((s) =>
          s.id === member.id ? { ...s, ...input, avatarUrl } : s
        )
      );
      setEditMember(null);
      toast.celebrate("Staff Updated", "Staff profile updated.");
      refresh();
    });
  };

  const handleSuspend = (member: StaffMember) => {
    startTransition(async () => {
      const action =
        member.status === "suspended" ? activateStaffAction : suspendStaffAction;
      const result = await action(member.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setStaff((prev) =>
        prev.map((s) =>
          s.id === member.id
            ? {
                ...s,
                status: s.status === "suspended" ? "active" : "suspended",
              }
            : s
        )
      );
      toast.celebrate(
        member.status === "suspended" ? "Staff Activated" : "Staff Suspended",
        member.status === "suspended"
          ? `${member.fullName} activated.`
          : `${member.fullName} suspended.`
      );
      refresh();
    });
  };

  const handleResetPassword = (member: StaffMember) => {
    startTransition(async () => {
      const result = await resetStaffPasswordAction(member.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.temporaryPassword) {
        setResetMember(member);
        setResetPassword(result.temporaryPassword);
        setResetDialogOpen(true);
      }
    });
  };

  const handleGenerateNewPassword = async (profileId: string) => {
    const result = await resetStaffPasswordAction(profileId);
    if (!result.success) {
      toast.error(result.error);
      return null;
    }
    if (result.temporaryPassword) {
      setResetPassword(result.temporaryPassword);
      return result.temporaryPassword;
    }
    return null;
  };

  return (
    <PageContainer
      title="Staff Management"
      description={`Manage employees at ${siteConfig.name}.`}
      actions={
        access.canManage ? (
          <Button size="sm" onClick={() => setCreateOpen(true)} disabled={isPending}>
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        ) : undefined
      }
    >
      <StaffStatsGrid stats={stats} />
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as StaffRole | "all")}
          className={selectClass}
          aria-label="Filter by role"
        >
          <option value="all">All Roles</option>
          {STAFF_ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StaffStatus | "all")}
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          {STAFF_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          No staff members found
        </div>
      ) : (
        <StaffTable
          staff={filtered}
          canManage={access.canManage}
          onEdit={access.canManage ? setEditMember : undefined}
          onSuspend={access.canManage ? handleSuspend : undefined}
          onResetPassword={access.canManage ? handleResetPassword : undefined}
        />
      )}
      {access.canManage ? (
        <>
          <CreateStaffModal
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreate={handleCreate}
            pending={isPending}
          />
          <EditStaffModal
            member={editMember}
            open={!!editMember}
            onOpenChange={(open) => !open && setEditMember(null)}
            onSave={handleSave}
            pending={isPending}
          />
          <PasswordResetSuccessDialog
            member={resetMember}
            password={resetPassword}
            open={resetDialogOpen}
            onOpenChange={(open) => {
              setResetDialogOpen(open);
              if (!open) {
                setResetMember(null);
                setResetPassword("");
              }
            }}
            onGenerateNew={handleGenerateNewPassword}
          />
        </>
      ) : null}
    </PageContainer>
  );
}
