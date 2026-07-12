import { describe, expect, it } from "vitest";
import { navItemsForRole } from "./nav-items";

describe("navItemsForRole", () => {
  it("gives admins the Organization Setup link", () => {
    const labels = navItemsForRole("ADMIN").map((item) => item.label);
    expect(labels).toContain("Organization Setup");
  });

  it("hides Organization Setup and Audits from employees", () => {
    const labels = navItemsForRole("EMPLOYEE").map((item) => item.label);
    expect(labels).not.toContain("Organization Setup");
    expect(labels).not.toContain("Audits");
  });

  it("gives department heads Reports but not Audits", () => {
    const labels = navItemsForRole("DEPARTMENT_HEAD").map((item) => item.label);
    expect(labels).toContain("Reports");
    expect(labels).not.toContain("Audits");
  });
});
