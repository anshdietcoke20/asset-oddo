import { describe, expect, it } from "vitest";
import { formatAssetTag } from "./asset-tag";

describe("formatAssetTag", () => {
  it("zero-pads single digit sequences to 4 digits", () => {
    expect(formatAssetTag(1)).toBe("AF-0001");
  });

  it("zero-pads double digit sequences", () => {
    expect(formatAssetTag(42)).toBe("AF-0042");
  });

  it("zero-pads triple digit sequences", () => {
    expect(formatAssetTag(123)).toBe("AF-0123");
  });

  it("does not truncate sequences with more than 4 digits", () => {
    expect(formatAssetTag(12345)).toBe("AF-12345");
  });

  it("handles the first asset in the system", () => {
    expect(formatAssetTag(0 + 1)).toBe("AF-0001");
  });
});
