import type { INotificationRepository } from "@/repositories/notification.repository";
import type { DbNotificationType } from "@/types/database";
import type { Notification } from "@/types/notification";

export function resolveNotificationHref(notification: Notification): string | null {
  if (!notification.entityId) {
    if (notification.module === "housekeeping") {
      return "/dashboard/housekeeping";
    }
    if (notification.module === "reservations") {
      return "/dashboard/reservations";
    }
    return null;
  }

  switch (notification.module) {
    case "reservations":
      return `/dashboard/reservations/${notification.entityId}`;
    case "housekeeping":
      return "/dashboard/housekeeping";
    case "shift_handover":
      return "/dashboard/shift-handover";
    default:
      return null;
  }
}

type OperationalNotificationInput = {
  title: string;
  message: string;
  type: DbNotificationType;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, unknown>;
};

export async function createOperationalNotification(
  notifications: INotificationRepository,
  input: OperationalNotificationInput
): Promise<void> {
  await notifications.create({
    user_id: null,
    title: input.title,
    message: input.message,
    type: input.type,
    priority: input.priority ?? "medium",
    module: input.module,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function notifyWebsiteReservation(
  notifications: INotificationRepository,
  input: {
    reservationId: string;
    reservationNumber: string;
    guestName: string;
    roomTypeName: string;
    checkIn: string;
    checkOut: string;
  }
): Promise<void> {
  await createOperationalNotification(notifications, {
    title: "New Reservation Request",
    message: `${input.guestName} · ${input.roomTypeName} · ${input.checkIn} → ${input.checkOut} · ${input.reservationNumber}`,
    type: "reservation_alert",
    module: "reservations",
    entityType: "reservation",
    entityId: input.reservationId,
    priority: "high",
    metadata: {
      reservation_number: input.reservationNumber,
      guest_name: input.guestName,
      room_type: input.roomTypeName,
      check_in: input.checkIn,
      check_out: input.checkOut,
      source: "website",
    },
  });
}

export async function notifyHousekeepingAlert(
  notifications: INotificationRepository,
  input: {
    roomId: string;
    roomNumber: string;
    title: string;
    message: string;
    alertKind: string;
  }
): Promise<void> {
  await createOperationalNotification(notifications, {
    title: input.title,
    message: input.message,
    type: "housekeeping_alert",
    module: "housekeeping",
    entityType: "room",
    entityId: input.roomId,
    priority: "medium",
    metadata: {
      room_number: input.roomNumber,
      alert_kind: input.alertKind,
    },
  });
}
