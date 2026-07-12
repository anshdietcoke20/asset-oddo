"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";

export async function markNotificationRead(id: string) {
  const user = await requireUser();

  const notification = await db.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== user.id) return;

  await db.notification.update({
    where: { id },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();

  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
}
