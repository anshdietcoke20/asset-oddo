export interface BookingInterval {
  startTime: Date;
  endTime: Date;
}

/**
 * True if the half-open interval [newStart, newEnd) intersects any of the
 * existing half-open intervals [startTime, endTime). Bookings that merely
 * touch (one ends exactly when the other starts) do not overlap.
 */
export function hasOverlap(
  existing: BookingInterval[],
  newStart: Date,
  newEnd: Date,
): boolean {
  return existing.some(
    (booking) => newStart < booking.endTime && booking.startTime < newEnd,
  );
}

export type DerivableBookingStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";

/**
 * Recomputes the display status for a booking from its start/end times.
 * CANCELLED is a terminal, manually-set status and is never overwritten -
 * every other status is derived fresh from `now` vs. the booking window.
 */
export function computeBookingStatus(
  currentStatus: DerivableBookingStatus,
  startTime: Date,
  endTime: Date,
  now: Date = new Date(),
): DerivableBookingStatus {
  if (currentStatus === "CANCELLED") return "CANCELLED";
  if (now < startTime) return "UPCOMING";
  if (now > endTime) return "COMPLETED";
  return "ONGOING";
}
