"use server";

import { requireRole } from "@/lib/dal";
import type { Role } from "@/generated/prisma/client";
import {
  toCsv,
  getUtilizationReport,
  getMaintenanceFrequencyReport,
  getDueForReviewReport,
  getDepartmentAllocationReport,
  getBookingHeatmapReport,
} from "@/lib/reports";

const REPORT_ROLES: Role[] = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"];

export async function exportUtilizationCsv(): Promise<string> {
  await requireRole(REPORT_ROLES);
  const { used } = await getUtilizationReport();
  return toCsv(
    used.map((asset) => ({
      "Asset Tag": asset.assetTag,
      "Asset Name": asset.name,
      "Total Days Allocated": Number(asset.totalDays.toFixed(1)),
      "Allocation Count": asset.allocationCount,
    })),
  );
}

export async function exportIdleAssetsCsv(): Promise<string> {
  await requireRole(REPORT_ROLES);
  const { idle } = await getUtilizationReport();
  return toCsv(
    idle.map((asset) => ({ "Asset Tag": asset.assetTag, "Asset Name": asset.name })),
  );
}

export async function exportMaintenanceByAssetCsv(): Promise<string> {
  await requireRole(REPORT_ROLES);
  const { byAsset } = await getMaintenanceFrequencyReport();
  return toCsv(
    byAsset.map((asset) => ({
      "Asset Tag": asset.assetTag,
      "Asset Name": asset.name,
      "Maintenance Requests": asset.count,
    })),
  );
}

export async function exportMaintenanceByCategoryCsv(): Promise<string> {
  await requireRole(REPORT_ROLES);
  const { byCategory } = await getMaintenanceFrequencyReport();
  return toCsv(
    byCategory.map((category) => ({
      Category: category.name,
      "Maintenance Requests": category.count,
    })),
  );
}

export async function exportRetirementCandidatesCsv(): Promise<string> {
  await requireRole(REPORT_ROLES);
  const { retirementCandidates } = await getDueForReviewReport();
  return toCsv(
    retirementCandidates.map((asset) => ({
      "Asset Tag": asset.assetTag,
      "Asset Name": asset.name,
      "Acquisition Date": asset.acquisitionDate
        ? asset.acquisitionDate.toISOString().slice(0, 10)
        : "",
      Condition: asset.condition,
    })),
  );
}

export async function exportMaintenanceDueCsv(): Promise<string> {
  await requireRole(REPORT_ROLES);
  const { maintenanceDueCandidates } = await getDueForReviewReport();
  return toCsv(
    maintenanceDueCandidates.map((asset) => ({
      "Asset Tag": asset.assetTag,
      "Asset Name": asset.name,
      "Resolved Requests (6 months)": asset.count,
    })),
  );
}

export async function exportDepartmentAllocationCsv(): Promise<string> {
  await requireRole(REPORT_ROLES);
  const summary = await getDepartmentAllocationReport();
  return toCsv(
    summary.map((department) => ({
      Department: department.name,
      "Active Allocations": department.count,
    })),
  );
}

export async function exportBookingHeatmapCsv(): Promise<string> {
  await requireRole(REPORT_ROLES);
  const heatmap = await getBookingHeatmapReport();
  return toCsv(heatmap.map((entry) => ({ Day: entry.day, Bookings: entry.count })));
}
