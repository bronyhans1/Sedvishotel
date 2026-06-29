"use client";

import Link from "next/link";
import {
  Eye,
  KeyRound,
  MoreHorizontal,
  Pencil,
  UserX,
} from "lucide-react";

import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { StaffRoleBadge } from "@/components/staff/StaffRoleBadge";
import { StaffStatusBadge } from "@/components/staff/StaffStatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StaffMember } from "@/types/staff";

type Props = {
  staff: StaffMember[];
  canManage?: boolean;
  onEdit?: (member: StaffMember) => void;
  onSuspend?: (member: StaffMember) => void;
  onResetPassword?: (member: StaffMember) => void;
};

export function StaffTable({
  staff,
  canManage = false,
  onEdit,
  onSuspend,
  onResetPassword,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-semibold">Photo</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="hidden px-4 py-3 font-semibold lg:table-cell">Department</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">Last Login</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <StaffAvatar
                    fullName={member.fullName}
                    avatarUrl={member.avatarUrl}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{member.fullName}</td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {member.email}
                </td>
                <td className="px-4 py-3">
                  <StaffRoleBadge role={member.role} />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">{member.department}</td>
                <td className="px-4 py-3">
                  <StaffStatusBadge status={member.status} />
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {member.lastLogin}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/staff/${member.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">View</span>
                      </Link>
                    </Button>
                    {canManage && onEdit ? (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(member)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
                      </Button>
                    ) : null}
                    {canManage && onSuspend && onResetPassword ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSuspend(member)}>
                          <UserX className="h-4 w-4" />
                          {member.status === "suspended" ? "Reactivate" : "Suspend"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onResetPassword(member)}>
                          <KeyRound className="h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
