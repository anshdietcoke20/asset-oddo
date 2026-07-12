import { describe, expect, it } from "vitest";
import {
  getAvailableMaintenanceActions,
  maintenancePriorityBadgeTone,
  maintenanceStatusBadgeTone,
} from "./maintenance";

describe("getAvailableMaintenanceActions", () => {
  it("offers approve/reject for a pending request to an asset manager", () => {
    expect(getAvailableMaintenanceActions("PENDING", "ASSET_MANAGER")).toEqual([
      "approve",
      "reject",
    ]);
  });

  it("offers approve/reject for a pending request to an admin", () => {
    expect(getAvailableMaintenanceActions("PENDING", "ADMIN")).toEqual(["approve", "reject"]);
  });

  it("offers assign for an approved request", () => {
    expect(getAvailableMaintenanceActions("APPROVED", "ADMIN")).toEqual(["assign"]);
  });

  it("offers start for a technician-assigned request", () => {
    expect(getAvailableMaintenanceActions("TECHNICIAN_ASSIGNED", "ADMIN")).toEqual(["start"]);
  });

  it("offers resolve for an in-progress request", () => {
    expect(getAvailableMaintenanceActions("IN_PROGRESS", "ADMIN")).toEqual(["resolve"]);
  });

  it("offers nothing for a resolved or rejected request", () => {
    expect(getAvailableMaintenanceActions("RESOLVED", "ADMIN")).toEqual([]);
    expect(getAvailableMaintenanceActions("REJECTED", "ADMIN")).toEqual([]);
  });

  it("offers nothing to non-manager roles regardless of status", () => {
    expect(getAvailableMaintenanceActions("PENDING", "EMPLOYEE")).toEqual([]);
    expect(getAvailableMaintenanceActions("PENDING", "DEPARTMENT_HEAD")).toEqual([]);
  });
});

describe("maintenanceStatusBadgeTone", () => {
  it("maps in-flight statuses to warning", () => {
    expect(maintenanceStatusBadgeTone("PENDING")).toBe("warning");
    expect(maintenanceStatusBadgeTone("TECHNICIAN_ASSIGNED")).toBe("warning");
    expect(maintenanceStatusBadgeTone("IN_PROGRESS")).toBe("warning");
  });

  it("maps approved to info, resolved to success, rejected to danger", () => {
    expect(maintenanceStatusBadgeTone("APPROVED")).toBe("info");
    expect(maintenanceStatusBadgeTone("RESOLVED")).toBe("success");
    expect(maintenanceStatusBadgeTone("REJECTED")).toBe("danger");
  });
});

describe("maintenancePriorityBadgeTone", () => {
  it("maps low/medium to neutral, high to warning, urgent to danger", () => {
    expect(maintenancePriorityBadgeTone("LOW")).toBe("neutral");
    expect(maintenancePriorityBadgeTone("MEDIUM")).toBe("neutral");
    expect(maintenancePriorityBadgeTone("HIGH")).toBe("warning");
    expect(maintenancePriorityBadgeTone("URGENT")).toBe("danger");
  });
});
