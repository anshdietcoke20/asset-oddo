import { describe, expect, it } from "vitest";
import { computeBookingStatus, hasOverlap } from "./booking-overlap";

describe("hasOverlap", () => {
  const existing = [
    { startTime: new Date("2026-07-12T10:00:00Z"), endTime: new Date("2026-07-12T12:00:00Z") },
  ];

  it("returns true for an exact overlap", () => {
    expect(
      hasOverlap(existing, new Date("2026-07-12T10:00:00Z"), new Date("2026-07-12T12:00:00Z")),
    ).toBe(true);
  });

  it("returns true for a partial overlap", () => {
    expect(
      hasOverlap(existing, new Date("2026-07-12T11:00:00Z"), new Date("2026-07-12T13:00:00Z")),
    ).toBe(true);
  });

  it("returns false when the new slot is adjacent (touching, not overlapping)", () => {
    // Starts exactly when the existing booking ends.
    expect(
      hasOverlap(existing, new Date("2026-07-12T12:00:00Z"), new Date("2026-07-12T13:00:00Z")),
    ).toBe(false);
    // Ends exactly when the existing booking starts.
    expect(
      hasOverlap(existing, new Date("2026-07-12T08:00:00Z"), new Date("2026-07-12T10:00:00Z")),
    ).toBe(false);
  });

  it("returns false when there is no overlap at all", () => {
    expect(
      hasOverlap(existing, new Date("2026-07-12T14:00:00Z"), new Date("2026-07-12T15:00:00Z")),
    ).toBe(false);
  });

  it("returns false for an empty existing list", () => {
    expect(hasOverlap([], new Date("2026-07-12T10:00:00Z"), new Date("2026-07-12T12:00:00Z"))).toBe(
      false,
    );
  });

  it("ignores bookings that don't overlap when checking one that does among several", () => {
    const many = [
      ...existing,
      { startTime: new Date("2026-07-12T13:00:00Z"), endTime: new Date("2026-07-12T14:00:00Z") },
    ];
    expect(
      hasOverlap(many, new Date("2026-07-12T13:30:00Z"), new Date("2026-07-12T13:45:00Z")),
    ).toBe(true);
  });
});

describe("computeBookingStatus", () => {
  const start = new Date("2026-07-12T10:00:00Z");
  const end = new Date("2026-07-12T12:00:00Z");

  it("returns UPCOMING when now is before the start", () => {
    expect(computeBookingStatus("UPCOMING", start, end, new Date("2026-07-12T09:00:00Z"))).toBe(
      "UPCOMING",
    );
  });

  it("returns ONGOING when now is within the window (inclusive bounds)", () => {
    expect(computeBookingStatus("UPCOMING", start, end, new Date("2026-07-12T10:00:00Z"))).toBe(
      "ONGOING",
    );
    expect(computeBookingStatus("UPCOMING", start, end, new Date("2026-07-12T11:00:00Z"))).toBe(
      "ONGOING",
    );
    expect(computeBookingStatus("ONGOING", start, end, new Date("2026-07-12T12:00:00Z"))).toBe(
      "ONGOING",
    );
  });

  it("returns COMPLETED when now is after the end", () => {
    expect(computeBookingStatus("ONGOING", start, end, new Date("2026-07-12T12:00:01Z"))).toBe(
      "COMPLETED",
    );
  });

  it("never overwrites a CANCELLED status", () => {
    expect(computeBookingStatus("CANCELLED", start, end, new Date("2026-07-12T11:00:00Z"))).toBe(
      "CANCELLED",
    );
  });
});
