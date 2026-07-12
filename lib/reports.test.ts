import { describe, expect, it } from "vitest";
import { allocationDurationDays, dayOfWeekIndex, toCsv } from "./reports";

describe("toCsv", () => {
  it("returns an empty string for an empty rows array", () => {
    expect(toCsv([])).toBe("");
  });

  it("writes a header row derived from the keys of the first row", () => {
    const csv = toCsv([{ Name: "Laptop", Count: 3 }]);
    expect(csv.split("\n")[0]).toBe("Name,Count");
  });

  it("writes one line per row in header order", () => {
    const csv = toCsv([
      { Name: "Laptop", Count: 3 },
      { Name: "Monitor", Count: 1 },
    ]);
    expect(csv).toBe("Name,Count\nLaptop,3\nMonitor,1");
  });

  it("quotes a value containing an embedded comma", () => {
    const csv = toCsv([{ Name: "Chair, Office", Count: 2 }]);
    expect(csv).toBe('Name,Count\n"Chair, Office",2');
  });

  it("quotes and doubles embedded double quotes", () => {
    const csv = toCsv([{ Name: 'The "Big" Desk', Count: 1 }]);
    expect(csv).toBe('Name,Count\n"The ""Big"" Desk",1');
  });

  it("quotes a value containing a newline", () => {
    const csv = toCsv([{ Notes: "Line one\nLine two" }]);
    expect(csv).toBe('Notes\n"Line one\nLine two"');
  });
});

describe("allocationDurationDays", () => {
  it("computes whole days between allocatedAt and returnedAt", () => {
    const allocatedAt = new Date("2026-07-01T00:00:00Z");
    const returnedAt = new Date("2026-07-05T00:00:00Z");
    expect(allocationDurationDays(allocatedAt, returnedAt)).toBe(4);
  });

  it("falls back to `now` when returnedAt is null", () => {
    const allocatedAt = new Date("2026-07-10T00:00:00Z");
    const now = new Date("2026-07-12T00:00:00Z");
    expect(allocationDurationDays(allocatedAt, null, now)).toBe(2);
  });

  it("clamps negative durations to 0", () => {
    const allocatedAt = new Date("2026-07-12T00:00:00Z");
    const returnedAt = new Date("2026-07-10T00:00:00Z");
    expect(allocationDurationDays(allocatedAt, returnedAt)).toBe(0);
  });
});

describe("dayOfWeekIndex", () => {
  it("maps Monday to index 0", () => {
    expect(dayOfWeekIndex(new Date("2026-07-13T12:00:00Z"))).toBe(0);
  });

  it("maps Sunday to index 6", () => {
    expect(dayOfWeekIndex(new Date("2026-07-12T12:00:00Z"))).toBe(6);
  });

  it("maps Saturday to index 5", () => {
    expect(dayOfWeekIndex(new Date("2026-07-11T12:00:00Z"))).toBe(5);
  });
});
