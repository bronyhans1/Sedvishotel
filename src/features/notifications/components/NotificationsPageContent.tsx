"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import { NotificationEmptyState } from "@/components/notifications/NotificationEmptyState";
import { NotificationPriorityBadge } from "@/components/notifications/NotificationPriorityBadge";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import { useSyncedProp } from "@/hooks/use-synced-prop";
import { useToast } from "@/hooks/use-toast";
import { formatModuleLabel } from "@/lib/activity/labels";
import { siteConfig } from "@/config/site";
import type { Notification } from "@/types/notification";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationItem({
  item,
  onMarkRead,
}: {
  item: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between ${
        !item.read ? "border-primary/30 bg-primary/5" : "bg-card"
      }`}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{item.title}</p>
          <NotificationPriorityBadge priority={item.priority} />
          {!item.read && (
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{item.message}</p>
        <p className="text-xs text-muted-foreground">
          {item.module ? formatModuleLabel(item.module) : "System"} · {formatTime(item.createdAt)}
        </p>
      </div>
      {!item.read && (
        <Button variant="outline" size="sm" onClick={() => onMarkRead(item.id)}>
          Mark read
        </Button>
      )}
    </div>
  );
}

type Props = {
  notifications: Notification[];
};

export function NotificationsPageContent({ notifications: initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useSyncedProp(initial);
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const unread = items.filter((n) => !n.read);
  const read = items.filter((n) => n.read);

  const markRead = (id: string) => {
    startTransition(async () => {
      const result = await markNotificationReadAction(id);
      if (result.success) {
        setItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        toast.celebrate("Notification Read", "Notification marked as read.");
        refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const markAllRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (result.success) {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.celebrate("All Read", "All notifications marked as read.");
        refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <PageContainer
      title="Notifications"
      description={`Alerts and updates for ${siteConfig.name}.`}
      actions={
        unread.length > 0 ? (
          <Button size="sm" variant="outline" onClick={markAllRead} disabled={isPending}>
            <CheckCheck className="h-4 w-4" />
            {isPending ? "Updating…" : "Mark all read"}
          </Button>
        ) : undefined
      }
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Unread ({unread.length})
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/audit">Audit dashboard</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {unread.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            unread.map((n) => (
              <NotificationItem key={n.id} item={n} onMarkRead={markRead} />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Read ({read.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {read.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No read notifications yet
            </p>
          ) : (
            read.map((n) => (
              <NotificationItem key={n.id} item={n} onMarkRead={markRead} />
            ))
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
