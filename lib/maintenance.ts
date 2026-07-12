import type { MaintenancePriority, MaintenanceStatus, Role } from "@/generated/prisma/client";
import type { BadgeTone } from "@/components/ui/badge";

export type MaintenanceAction = "approve" | "reject" | "assign" | "start" | "resolve";

const MANAGER_ROLES: Role[] = ["ADMIN", "ASSET_MANAGER"];

/**
 * Determines which maintenance-workflow actions should be offered for a given
 * request, based on its current status and the viewing user's role. Only
 * asset managers/admins can drive the workflow forward; everyone else sees no
 * actions (they can only raise new requests).
 */
export function getAvailableMaintenanceActions(
  status: MaintenanceStatus,
  role: Role,
): MaintenanceAction[] {
  if (!MANAGER_ROLES.includes(role)) return [];

  switch (status) {
    case "PENDING":
      return ["approve", "reject"];
    case "APPROVED":
      return ["assign"];
    case "TECHNICIAN_ASSIGNED":
      return ["start"];
    case "IN_PROGRESS":
      return ["resolve"];
    default:
      return [];
  }
}

export function maintenanceStatusBadgeTone(status: MaintenanceStatus): BadgeTone {
  switch (status) {
    case "PENDING":
    case "TECHNICIAN_ASSIGNED":
    case "IN_PROGRESS":
      return "warning";
    case "APPROVED":
      return "info";
    case "RESOLVED":
      return "success";
    case "REJECTED":
      return "danger";
    default:
      return "neutral";
  }
}

export function maintenancePriorityBadgeTone(priority: MaintenancePriority): BadgeTone {
  switch (priority) {
    case "HIGH":
      return "warning";
    case "URGENT":
      return "danger";
    default:
      return "neutral";
  }
}
