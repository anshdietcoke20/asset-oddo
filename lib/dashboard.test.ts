import { describe, expect, it } from "vitest";
import { getUpcomingReturnWindow, isOverdueReturn, isUpcomingReturn } from "./dashboard";

const NOW = new Date("2026-07-12T12:00:00.000Z");

describe("getUpcomingReturnWindow", () => {
  it("spans from now to 7 days later", () => {
    const { from, to } = getUpcomingReturnWindow(NOW);
    expect(from).toEqual(NOW);
    expect(to).toEqual(new Date("2026-07-19T12:00:00.000Z"));
  });
});

describe("isOverdueReturn", () => {
  it("is true for a date in the past", () => {
    expect(isOverdueReturn(new Date("2026-07-10T00:00:00.000Z"), NOW)).toBe(true);
  });

  it("is false for a date in the future", () => {
    expect(isOverdueReturn(new Date("2026-07-13T00:00:00.000Z"), NOW)).toBe(false);
  });

  it("is false for the exact current instant", () => {
    expect(isOverdueReturn(NOW, NOW)).toBe(false);
  });
});

describe("isUpcomingReturn", () => {
  it("is true for a date within the next 7 days", () => {
    expect(isUpcomingReturn(new Date("2026-07-15T00:00:00.000Z"), NOW)).toBe(true);
  });

  it("is false for a date beyond the 7-day window", () => {
    expect(isUpcomingReturn(new Date("2026-07-20T00:00:00.000Z"), NOW)).toBe(false);
  });

  it("is false for a date already in the past", () => {
    expect(isUpcomingReturn(new Date("2026-07-11T00:00:00.000Z"), NOW)).toBe(false);
  });

  it("includes the boundary instants", () => {
    expect(isUpcomingReturn(NOW, NOW)).toBe(true);
    expect(isUpcomingReturn(new Date("2026-07-19T12:00:00.000Z"), NOW)).toBe(true);
  });
});
