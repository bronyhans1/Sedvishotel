"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import {
  revalidateDashboardWidgets,
  revalidateGroupReservationPaths,
} from "@/lib/cache/revalidate-operational-paths";
import { getServiceContext } from "@/lib/auth/service-context";
import { getGroupReservationService } from "@/lib/group-reservations/get-group-reservation-service";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import type { CreateGroupInput, UpdateGroupInput } from "@/types/group-reservation";
import type { CreateReservationBlockInput } from "@/types/reservation-block";
import type { ReservationFormValues } from "@/types/reservation";

export type GroupActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

export async function createGroupAction(
  input: CreateGroupInput
): Promise<GroupActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGroupReservationService();
    const group = await service.createGroup(ctx, session, input);
    revalidateGroupReservationPaths(group.id);
    return { success: true, id: group.id };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function updateGroupAction(
  id: string,
  input: UpdateGroupInput
): Promise<GroupActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGroupReservationService();
    await service.updateGroup(ctx, session, id, input);
    revalidateGroupReservationPaths(id);
    return { success: true, id };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function confirmGroupAction(id: string): Promise<GroupActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGroupReservationService();
    await service.confirmGroup(ctx, session, id);
    revalidateGroupReservationPaths(id);
    return { success: true, id };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function cancelGroupAction(
  id: string,
  reason?: string
): Promise<GroupActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGroupReservationService();
    await service.cancelGroup(ctx, session, id, reason);
    revalidateGroupReservationPaths(id);
    return { success: true, id };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function addGroupReservationAction(
  groupId: string,
  values: ReservationFormValues,
  setAsMaster?: boolean
): Promise<GroupActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGroupReservationService();
    await service.addReservation(ctx, session, groupId, values, { setAsMaster });
    revalidateGroupReservationPaths(groupId);
    revalidatePath("/dashboard/reservations");
    revalidateDashboardWidgets();
    return { success: true, id: groupId };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function createGroupBlockAction(
  input: CreateReservationBlockInput
): Promise<GroupActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGroupReservationService();
    await service.createBlock(ctx, session, input);
    revalidateGroupReservationPaths(input.groupReservationId);
    return { success: true, id: input.groupReservationId };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function bulkGroupCheckInAction(
  reservationIds: string[]
): Promise<GroupActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getReservationService();
    for (const id of reservationIds) {
      await service.completeCheckIn(ctx, session, id);
    }
    revalidatePath("/dashboard/check-in");
    revalidatePath("/dashboard/stays");
    revalidatePath("/dashboard/reservations");
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function bulkGroupCheckOutAction(
  reservationIds: string[]
): Promise<GroupActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getReservationService();
    for (const id of reservationIds) {
      await service.completeCheckOut(ctx, session, id);
    }
    revalidatePath("/dashboard/check-out");
    revalidatePath("/dashboard/stays");
    revalidatePath("/dashboard/reservations");
    revalidateDashboardWidgets();
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function assignGroupRoomAction(
  groupId: string,
  reservationId: string,
  roomNumber: string
): Promise<GroupActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGroupReservationService();
    await service.assignRoom(ctx, session, groupId, reservationId, roomNumber);
    revalidateGroupReservationPaths(groupId);
    return { success: true, id: groupId };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function assignGroupGuestAction(
  groupId: string,
  reservationId: string,
  values: Pick<ReservationFormValues, "guestName" | "guestPhone" | "guestEmail">
): Promise<GroupActionResult> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getGroupReservationService();
    await service.assignGuest(ctx, session, groupId, reservationId, values);
    revalidateGroupReservationPaths(groupId);
    return { success: true, id: groupId };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function searchGroupsAction(query: string) {
  try {
    const { session, ctx } = await getServiceContext();
    const { getCorporateAccountServiceClient } = await import(
      "@/lib/corporate/get-corporate-account-service"
    );
    const { executeUnifiedGroupSearch } = await import(
      "@/lib/group-reservations/unified-search"
    );
    const { SupabaseCorporateAccountRepository } = await import(
      "@/repositories/supabase/corporate-account.repository"
    );
    const { SupabaseGroupReservationRepository } = await import(
      "@/repositories/supabase/group-reservation.repository"
    );
    const { SupabaseGuestRepository } = await import(
      "@/repositories/supabase/guest.repository"
    );
    const { SupabaseReservationRepository } = await import(
      "@/repositories/supabase/reservation.repository"
    );
    const { sessionHasPermission } = await import("@/lib/auth/permissions");

    if (
      !sessionHasPermission(session, "group_reservations", "view") &&
      !sessionHasPermission(session, "corporate_accounts", "view")
    ) {
      return { success: true as const, results: [] };
    }

    const client = await getCorporateAccountServiceClient();
    const results = await executeUnifiedGroupSearch(
      {
        groups: new SupabaseGroupReservationRepository(client),
        corporate: new SupabaseCorporateAccountRepository(client),
        reservations: new SupabaseReservationRepository(client),
        guests: new SupabaseGuestRepository(client),
      },
      { query }
    );
    void ctx;
    return { success: true as const, results };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false as const, error: toSafeActionError(err), results: [] };
  }
}
