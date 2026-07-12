import { describe, expect, it } from "vitest";
import { isValidDepartmentParent } from "./org-validation";

describe("isValidDepartmentParent", () => {
  it("allows any parent when creating a new department (no id yet)", () => {
    expect(isValidDepartmentParent(undefined, "dept_1")).toBe(true);
  });

  it("allows leaving the parent unset", () => {
    expect(isValidDepartmentParent("dept_1", undefined)).toBe(true);
    expect(isValidDepartmentParent("dept_1", null)).toBe(true);
  });

  it("allows a distinct parent department", () => {
    expect(isValidDepartmentParent("dept_1", "dept_2")).toBe(true);
  });

  it("rejects a department being its own parent", () => {
    expect(isValidDepartmentParent("dept_1", "dept_1")).toBe(false);
  });
});
