"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  openNotificationAction,
} from "@/features/notifications/actions";
import { resolveNotificationHref } from "@/lib/notifications/operational-notifications";
import type { Notification } from "@/types/notification";

type NotificationBellProps = {
  notifications: Notification[];
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const unread = notifications.filter((item) => !item.read);
  const preview = notifications.slice(0, 8);

  const refresh = () => {
    startTransition(() => router.refresh());
  };

  const handleOpen = (notification: Notification) => {
    startTransition(async () => {
      await openNotificationAction(notification.id);
      const href = resolveNotificationHref(notification);
      if (href) {
        router.push(href);
      } else {
        router.push("/dashboard/notifications");
      }
      refresh();
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteNotificationAction(id);
      refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread.length > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-bold text-brand-navy">
              {unread.length > 99 ? "99+" : unread.length}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          {unread.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {preview.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          preview.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex cursor-pointer flex-col items-start gap-1 p-3"
              onSelect={(event) => {
                event.preventDefault();
                handleOpen(notification);
              }}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <p className="font-medium leading-snug">{notification.title}</p>
                {!notification.read ? (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{notification.message}</p>
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {formatTime(notification.createdAt)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-0 text-[11px]"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleDelete(notification.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notifications" className="w-full cursor-pointer justify-center">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
