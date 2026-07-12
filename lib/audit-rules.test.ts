import { describe, expect, it } from "vitest";
import { isCloseable, discrepancyItems, dedupeAssetIds } from "./audit-rules";

describe("isCloseable", () => {
  it("returns true when every item has been verified", () => {
    expect(
      isCloseable([{ result: "VERIFIED" }, { result: "MISSING" }, { result: "DAMAGED" }]),
    ).toBe(true);
  });

  it("returns false when any item is still pending", () => {
    expect(isCloseable([{ result: "VERIFIED" }, { result: "PENDING" }])).toBe(false);
  });

  it("returns true for an empty item list", () => {
    expect(isCloseable([])).toBe(true);
  });
});

describe("discrepancyItems", () => {
  it("keeps only MISSING and DAMAGED items", () => {
    const items = [
      { id: "1", result: "VERIFIED" as const },
      { id: "2", result: "MISSING" as const },
      { id: "3", result: "DAMAGED" as const },
      { id: "4", result: "PENDING" as const },
    ];
    expect(discrepancyItems(items).map((i) => i.id)).toEqual(["2", "3"]);
  });

  it("returns an empty array when there are no discrepancies", () => {
    const items = [{ id: "1", result: "VERIFIED" as const }];
    expect(discrepancyItems(items)).toEqual([]);
  });
});

describe("dedupeAssetIds", () => {
  it("removes duplicates while preserving first-seen order", () => {
    expect(dedupeAssetIds(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for an empty input", () => {
    expect(dedupeAssetIds([])).toEqual([]);
  });
});
