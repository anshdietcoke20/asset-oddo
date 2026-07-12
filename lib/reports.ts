import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested in lib/reports.test.ts, no DB access)
// ---------------------------------------------------------------------------

/**
 * Serializes rows of primitive values to CSV text. Values containing a
 * comma, double quote, or newline are wrapped in quotes with any embedded
 * quotes doubled, per the usual CSV escaping convention. Returns an empty
 * string when there are no rows (no header to derive columns from).
 */
export function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(","));
  }
  return lines.join("\n");
}

/**
 * Number of days (fractional) an allocation has occupied an asset: from
 * allocatedAt to returnedAt, or to `now` if it hasn't been returned yet.
 * Clamped to 0 so clock skew / bad data never produces a negative duration.
 */
export function allocationDurationDays(
  allocatedAt: Date,
  returnedAt: Date | null,
  now: Date = new Date(),
): number {
  const end = returnedAt ?? now;
  const ms = end.getTime() - allocatedAt.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Maps a Date to a Mon-first day-of-week index (0 = Mon .. 6 = Sun).
 * `Date#getDay()` is Sun-first (0 = Sun .. 6 = Sat), so it's rotated by one.
 */
export function dayOfWeekIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// ---------------------------------------------------------------------------
// Data getters (shared between the Reports page and the CSV export actions)
// ---------------------------------------------------------------------------

export async function getUtilizationReport() {
  const assets = await db.asset.findMany({
    select: {
      id: true,
      name: true,
      assetTag: true,
      allocations: { select: { allocatedAt: true, returnedAt: true } },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const withTotals = assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    assetTag: asset.assetTag,
    allocationCount: asset.allocations.length,
    totalDays: asset.allocations.reduce(
      (sum, allocation) =>
        sum + allocationDurationDays(allocation.allocatedAt, allocation.returnedAt, now),
      0,
    ),
  }));

  const used = withTotals
    .filter((asset) => asset.allocationCount > 0)
    .sort((a, b) => b.totalDays - a.totalDays);
  const idle = withTotals.filter((asset) => asset.allocationCount === 0);

  return { used, idle };
}

export async function getMaintenanceFrequencyReport() {
  const requests = await db.maintenanceRequest.findMany({
    select: {
      assetId: true,
      asset: {
        select: {
          name: true,
          assetTag: true,
          categoryId: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  const byAssetMap = new Map<string, { name: string; assetTag: string; count: number }>();
  const byCategoryMap = new Map<string, { name: string; count: number }>();

  for (const request of requests) {
    const assetEntry = byAssetMap.get(request.assetId) ?? {
      name: request.asset.name,
      assetTag: request.asset.assetTag,
      count: 0,
    };
    assetEntry.count += 1;
    byAssetMap.set(request.assetId, assetEntry);

    const categoryEntry = byCategoryMap.get(request.asset.categoryId) ?? {
      name: request.asset.category.name,
      count: 0,
    };
    categoryEntry.count += 1;
    byCategoryMap.set(request.asset.categoryId, categoryEntry);
  }

  return {
    byAsset: [...byAssetMap.values()].sort((a, b) => b.count - a.count),
    byCategory: [...byCategoryMap.values()].sort((a, b) => b.count - a.count),
  };
}

export async function getDueForReviewReport() {
  const now = new Date();

  const threeYearsAgo = new Date(now);
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [retirementAssets, resolvedRequests] = await Promise.all([
    db.asset.findMany({
      where: {
        acquisitionDate: { lt: threeYearsAgo },
        status: { notIn: ["RETIRED", "DISPOSED"] },
      },
      select: { id: true, name: true, assetTag: true, acquisitionDate: true, condition: true },
      orderBy: { acquisitionDate: "asc" },
    }),
    db.maintenanceRequest.findMany({
      where: { status: "RESOLVED", resolvedAt: { gte: sixMonthsAgo } },
      select: { assetId: true, asset: { select: { name: true, assetTag: true } } },
    }),
  ]);

  const resolvedCountMap = new Map<
    string,
    { name: string; assetTag: string; count: number }
  >();
  for (const request of resolvedRequests) {
    const entry = resolvedCountMap.get(request.assetId) ?? {
      name: request.asset.name,
      assetTag: request.asset.assetTag,
      count: 0,
    };
    entry.count += 1;
    resolvedCountMap.set(request.assetId, entry);
  }

  return {
    retirementCandidates: retirementAssets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      assetTag: asset.assetTag,
      acquisitionDate: asset.acquisitionDate,
      condition: asset.condition,
    })),
    maintenanceDueCandidates: [...resolvedCountMap.values()]
      .filter((entry) => entry.count >= 3)
      .sort((a, b) => b.count - a.count),
  };
}

export async function getDepartmentAllocationReport() {
  const [departments, activeAllocations] = await Promise.all([
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.assetAllocation.findMany({
      where: { status: "ACTIVE" },
      select: {
        departmentId: true,
        employee: { select: { departmentId: true } },
      },
    }),
  ]);

  const countMap = new Map<string, number>();
  for (const allocation of activeAllocations) {
    const departmentId = allocation.departmentId ?? allocation.employee?.departmentId ?? null;
    if (!departmentId) continue;
    countMap.set(departmentId, (countMap.get(departmentId) ?? 0) + 1);
  }

  return departments
    .map((department) => ({
      id: department.id,
      name: department.name,
      count: countMap.get(department.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getBookingHeatmapReport() {
  const bookings = await db.booking.findMany({ select: { startTime: true } });

  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const booking of bookings) {
    counts[dayOfWeekIndex(booking.startTime)] += 1;
  }

  return DAY_LABELS.map((day, index) => ({ day, count: counts[index] }));
}
