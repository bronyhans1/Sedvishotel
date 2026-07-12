import { createOperationalNotification } from "@/lib/notifications/operational-notifications";
import type { INotificationRepository } from "@/repositories/notification.repository";

export async function notifyLargeGroupArrival(
  notifications: INotificationRepository,
  input: {
    groupId: string;
    groupNumber: string;
    groupName: string;
    expectedRooms: number;
    arrivalDate: string;
  }
): Promise<void> {
  await createOperationalNotification(notifications, {
    title: "Large Group Arriving",
    message: `${input.groupName} (${input.groupNumber}) · ${input.expectedRooms} rooms · arrives ${input.arrivalDate}`,
    type: "group_alert",
    module: "group_reservations",
    entityType: "group_reservation",
    entityId: input.groupId,
    priority: "high",
    metadata: {
      group_number: input.groupNumber,
      expected_rooms: input.expectedRooms,
      arrival_date: input.arrivalDate,
    },
  });
}

export async function notifyBlockExpiring(
  notifications: INotificationRepository,
  input: {
    groupId: string;
    groupNumber: string;
    holdUntil: string;
    blockId: string;
  }
): Promise<void> {
  await createOperationalNotification(notifications, {
    title: "Reservation Block Active",
    message: `Group ${input.groupNumber} has a room block until ${input.holdUntil}`,
    type: "block_alert",
    module: "group_reservations",
    entityType: "reservation_block",
    entityId: input.blockId,
    priority: "medium",
    metadata: {
      group_id: input.groupId,
      hold_until: input.holdUntil,
    },
  });
}

export async function notifyBlockReleased(
  notifications: INotificationRepository,
  input: {
    groupId: string;
    groupNumber: string;
    blockId: string;
  }
): Promise<void> {
  await createOperationalNotification(notifications, {
    title: "Reservation Block Released",
    message: `Room block released for group ${input.groupNumber}`,
    type: "block_alert",
    module: "group_reservations",
    entityType: "reservation_block",
    entityId: input.blockId,
    priority: "low",
    metadata: { group_id: input.groupId },
  });
}

export async function notifyCorporateCreditLimitReached(
  notifications: INotificationRepository,
  input: {
    corporateAccountId: string;
    companyName: string;
    outstandingBalance: number;
    creditLimit: number;
  }
): Promise<void> {
  await createOperationalNotification(notifications, {
    title: "Corporate Credit Limit Reached",
    message: `${input.companyName} outstanding ${input.outstandingBalance.toFixed(2)} exceeds limit ${input.creditLimit.toFixed(2)}`,
    type: "corporate_alert",
    module: "corporate_accounts",
    entityType: "corporate_account",
    entityId: input.corporateAccountId,
    priority: "critical",
    metadata: {
      outstanding_balance: input.outstandingBalance,
      credit_limit: input.creditLimit,
    },
  });
}

export async function notifyGroupFullyCheckedIn(
  notifications: INotificationRepository,
  input: { groupId: string; groupNumber: string; groupName: string }
): Promise<void> {
  await createOperationalNotification(notifications, {
    title: "Group Fully Checked In",
    message: `${input.groupName} (${input.groupNumber}) — all rooms checked in`,
    type: "group_alert",
    module: "group_reservations",
    entityType: "group_reservation",
    entityId: input.groupId,
    priority: "medium",
  });
}

export async function notifyGroupFullyCheckedOut(
  notifications: INotificationRepository,
  input: { groupId: string; groupNumber: string; groupName: string }
): Promise<void> {
  await createOperationalNotification(notifications, {
    title: "Group Fully Checked Out",
    message: `${input.groupName} (${input.groupNumber}) — all rooms checked out`,
    type: "group_alert",
    module: "group_reservations",
    entityType: "group_reservation",
    entityId: input.groupId,
    priority: "medium",
  });
}

export async function notifyOutstandingCorporateBalance(
  notifications: INotificationRepository,
  input: {
    corporateAccountId: string;
    companyName: string;
    outstandingBalance: number;
  }
): Promise<void> {
  await createOperationalNotification(notifications, {
    title: "Outstanding Corporate Balance",
    message: `${input.companyName} has ${input.outstandingBalance.toFixed(2)} outstanding`,
    type: "corporate_alert",
    module: "corporate_accounts",
    entityType: "corporate_account",
    entityId: input.corporateAccountId,
    priority: "high",
    metadata: { outstanding_balance: input.outstandingBalance },
  });
}
