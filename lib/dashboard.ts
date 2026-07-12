/**
 * Pure date-boundary helpers for the dashboard KPI grid. Kept separate from
 * the page's Prisma queries so the "upcoming vs overdue" boundary logic is
 * unit-testable without a database.
 */

const UPCOMING_RETURN_WINDOW_DAYS = 7;

export function getUpcomingReturnWindow(now: Date = new Date()) {
  const from = now;
  const to = new Date(now.getTime() + UPCOMING_RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return { from, to };
}

export function isOverdueReturn(expectedReturnDate: Date, now: Date = new Date()): boolean {
  return expectedReturnDate.getTime() < now.getTime();
}

export function isUpcomingReturn(expectedReturnDate: Date, now: Date = new Date()): boolean {
  const { from, to } = getUpcomingReturnWindow(now);
  return expectedReturnDate.getTime() >= from.getTime() && expectedReturnDate.getTime() <= to.getTime();
}
