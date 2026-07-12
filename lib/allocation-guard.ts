import type { AssetStatus } from "@/generated/prisma/client";

/**
 * Conflict guard for the allocation workflow: an asset can only be newly
 * allocated when it is currently AVAILABLE. Any other status (ALLOCATED,
 * RESERVED, UNDER_MAINTENANCE, LOST, RETIRED, DISPOSED) means it is already
 * spoken for or otherwise not allocatable.
 *
 * This is the pure, testable expression of the rule. The server action in
 * lib/actions/allocations.ts is what actually enforces it, by re-reading the
 * asset's live status inside the mutation and calling this function before
 * writing anything.
 */
export function canAllocate(assetStatus: AssetStatus): boolean {
  return assetStatus === "AVAILABLE";
}
