"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { logActivity } from "@/lib/activity";
import { notify } from "@/lib/notifications";
import {
  computeBookingStatus,
  hasOverlap,
  type DerivableBookingStatus,
} from "@/lib/booking-overlap";

export type BookingFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: string }
  | undefined;

const CAN_MANAGE_OTHERS = ["ADMIN", "ASSET_MANAGER"] as const;

const BookingFieldsSchema = z.object({
  assetId: z.string().min(1, "Choose an asset"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  purpose: z.string().trim().max(500).optional(),
});

function endAfterStart(data: { startTime: string; endTime: string }) {
  return new Date(data.endTime) > new Date(data.startTime);
}

const BookingSchema = BookingFieldsSchema.refine(endAfterStart, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export async function createBookingAction(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await requireUser();

  const parsed = BookingSchema.safeParse({
    assetId: formData.get("assetId"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    purpose: formData.get("purpose") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { assetId, purpose } = parsed.data;
  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(parsed.data.endTime);

  const asset = await db.asset.findUnique({ where: { id: assetId } });
  if (!asset || !asset.isShared) {
    return { error: "That asset is not bookable." };
  }

  const existing = await db.booking.findMany({
    where: { assetId, status: { not: "CANCELLED" } },
    select: { startTime: true, endTime: true },
  });
  if (hasOverlap(existing, startTime, endTime)) {
    return { error: "This time slot conflicts with an existing booking." };
  }

  const booking = await db.booking.create({
    data: {
      assetId,
      bookedById: user.id,
      startTime,
      endTime,
      purpose: purpose || undefined,
    },
  });

  await logActivity({
    actorId: user.id,
    action: "BOOKING_CREATED",
    entityType: "Booking",
    entityId: booking.id,
    metadata: { assetId, startTime, endTime },
  });
  await notify({
    userId: user.id,
    type: "BOOKING_CONFIRMED",
    message: `Your booking for "${asset.name}" is confirmed.`,
    entityType: "Booking",
    entityId: booking.id,
  });

  revalidatePath("/bookings");
  return { success: "Booking created." };
}

const RescheduleSchema = BookingFieldsSchema.extend({
  bookingId: z.string().min(1),
}).refine(endAfterStart, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export async function rescheduleBookingAction(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await requireUser();

  const parsed = RescheduleSchema.safeParse({
    bookingId: formData.get("bookingId"),
    assetId: formData.get("assetId"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    purpose: formData.get("purpose") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { bookingId, assetId, purpose } = parsed.data;
  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(parsed.data.endTime);

  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { asset: true } });
  if (!booking) {
    return { error: "Booking not found." };
  }
  const canManage =
    booking.bookedById === user.id ||
    (CAN_MANAGE_OTHERS as readonly string[]).includes(user.role);
  if (!canManage) {
    return { error: "You are not allowed to reschedule this booking." };
  }
  if (booking.status === "CANCELLED") {
    return { error: "A cancelled booking cannot be rescheduled." };
  }

  const existing = await db.booking.findMany({
    where: { assetId, status: { not: "CANCELLED" }, id: { not: bookingId } },
    select: { startTime: true, endTime: true },
  });
  if (hasOverlap(existing, startTime, endTime)) {
    return { error: "This time slot conflicts with an existing booking." };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { assetId, startTime, endTime, purpose: purpose || undefined, status: "UPCOMING" },
  });

  await logActivity({
    actorId: user.id,
    action: "BOOKING_RESCHEDULED",
    entityType: "Booking",
    entityId: booking.id,
    metadata: { assetId, startTime, endTime },
  });
  await notify({
    userId: booking.bookedById,
    type: "BOOKING_CONFIRMED",
    message: `Your booking for "${booking.asset.name}" was rescheduled.`,
    entityType: "Booking",
    entityId: booking.id,
  });

  revalidatePath("/bookings");
  return { success: "Booking rescheduled." };
}

export async function cancelBookingAction(bookingId: string) {
  const user = await requireUser();

  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { asset: true } });
  if (!booking) return;

  const canManage =
    booking.bookedById === user.id ||
    (CAN_MANAGE_OTHERS as readonly string[]).includes(user.role);
  if (!canManage) return;
  if (booking.status === "CANCELLED") return;

  await db.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

  await logActivity({
    actorId: user.id,
    action: "BOOKING_CANCELLED",
    entityType: "Booking",
    entityId: booking.id,
  });
  await notify({
    userId: booking.bookedById,
    type: "BOOKING_CANCELLED",
    message: `Your booking for "${booking.asset.name}" was cancelled.`,
    entityType: "Booking",
    entityId: booking.id,
  });

  revalidatePath("/bookings");
}

/**
 * Sends a BOOKING_REMINDER notification for every still-UPCOMING booking
 * starting within the next hour. Wiring this to a scheduler/cron job is out
 * of scope for this sprint - it's implemented and callable on demand.
 */
export async function sendUpcomingBookingReminders() {
  const now = new Date();
  const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

  const upcoming = await db.booking.findMany({
    where: { status: "UPCOMING", startTime: { gte: now, lte: in1Hour } },
    include: { asset: true },
  });

  for (const booking of upcoming) {
    await notify({
      userId: booking.bookedById,
      type: "BOOKING_REMINDER",
      message: `Reminder: your booking for "${booking.asset.name}" starts at ${booking.startTime.toLocaleString()}.`,
      entityType: "Booking",
      entityId: booking.id,
    });
  }

  return upcoming.length;
}

/**
 * Recomputes and persists the derived status (UPCOMING/ONGOING/COMPLETED) for
 * a set of bookings based on the current time, leaving CANCELLED untouched.
 * Called on every read of the bookings list so displayed status is always fresh.
 */
export async function syncBookingStatuses<
  T extends { id: string; startTime: Date; endTime: Date; status: string },
>(bookings: T[]): Promise<T[]> {
  const now = new Date();
  const updates: { id: string; status: Exclude<DerivableBookingStatus, "CANCELLED"> }[] = [];

  const synced = bookings.map((booking) => {
    if (booking.status === "CANCELLED") return booking;
    const derived = computeBookingStatus(
      booking.status as DerivableBookingStatus,
      booking.startTime,
      booking.endTime,
      now,
    ) as Exclude<DerivableBookingStatus, "CANCELLED">;

    if (derived !== booking.status) {
      updates.push({ id: booking.id, status: derived });
      return { ...booking, status: derived };
    }
    return booking;
  });

  if (updates.length > 0) {
    await Promise.all(
      updates.map((u) => db.booking.update({ where: { id: u.id }, data: { status: u.status } })),
    );
  }

  return synced;
}
