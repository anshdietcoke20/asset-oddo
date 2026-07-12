import type { AuditItemResult } from "@/generated/prisma/client";

/**
 * A cycle can only be closed once every audit item in it has been verified
 * (i.e. no item is left in the default PENDING state).
 */
export function isCloseable(items: Array<{ result: AuditItemResult }>): boolean {
  return items.every((item) => item.result !== "PENDING");
}

/**
 * The discrepancy report only cares about items flagged MISSING or DAMAGED.
 */
export function discrepancyItems<T extends { result: AuditItemResult }>(items: T[]): T[] {
  return items.filter((item) => item.result === "MISSING" || item.result === "DAMAGED");
}

/**
 * Dedupe a list of asset ids gathered from possibly-overlapping scope queries
 * (e.g. a department match and a location match) while preserving order of
 * first appearance.
 */
export function dedupeAssetIds(assetIds: string[]): string[] {
  return Array.from(new Set(assetIds));
}
