import { db } from "@/lib/db";

export type NotificationType =
  | "ASSET_ASSIGNED"
  | "MAINTENANCE_APPROVED"
  | "MAINTENANCE_REJECTED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REMINDER"
  | "TRANSFER_REQUESTED"
  | "TRANSFER_APPROVED"
  | "TRANSFER_REJECTED"
  | "OVERDUE_RETURN_ALERT"
  | "AUDIT_DISCREPANCY_FLAGGED"
  | "ROLE_PROMOTED";

export async function notify(input: {
  userId: string;
  type: NotificationType;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  });
}

export async function notifyMany(
  userIds: string[],
  input: Omit<Parameters<typeof notify>[0], "userId">,
) {
  await Promise.all(userIds.map((userId) => notify({ ...input, userId })));
}
