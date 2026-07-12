/**
 * Formats a sequential asset number into an asset tag like "AF-0001".
 * Pure function so it can be unit tested without touching the database.
 */
export function formatAssetTag(sequence: number): string {
  return `AF-${String(sequence).padStart(4, "0")}`;
}
