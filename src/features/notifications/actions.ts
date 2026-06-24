"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getServiceContext } from "@/lib/auth/service-context";
import { getNotificationService } from "@/lib/notifications/get-notification-service";

export type NotificationActionResult =
  | { success: true }
  | { success: false; error: string };

export async function markNotificationReadAction(
  id: string
): Promise<NotificationActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getNotificationService();
    await service.markRead(ctx, session, id);
    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getNotificationService();
    await service.markAllRead(ctx, session);
    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
