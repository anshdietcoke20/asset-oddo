import { describe, expect, it } from "vitest";
import { canAllocate } from "./allocation-guard";

describe("canAllocate", () => {
  it("allows allocation when the asset is AVAILABLE", () => {
    expect(canAllocate("AVAILABLE")).toBe(true);
  });

  it.each([
    "ALLOCATED",
    "RESERVED",
    "UNDER_MAINTENANCE",
    "LOST",
    "RETIRED",
    "DISPOSED",
  ] as const)("blocks allocation when the asset is %s", (status) => {
    expect(canAllocate(status)).toBe(false);
  });
});
