"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStaffInitials } from "@/lib/staff/initials";
import { cn } from "@/lib/utils";

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
};

export function StaffAvatar({
  fullName,
  avatarUrl,
  className,
  fallbackClassName,
}: Props) {
  const initials = getStaffInitials(fullName);

  return (
    <Avatar className={cn("h-9 w-9", className)}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={fullName} />
      ) : null}
      <AvatarFallback
        className={cn(
          "bg-primary/10 text-xs font-semibold text-primary",
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
