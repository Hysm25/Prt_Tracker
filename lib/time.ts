/**
 * Utilities for formatting timestamps and refresh intervals
 */

/**
 * Formats a timestamp (ISO string or unix milliseconds) into a human-readable
 * "Updated X hours ago" label.
 *
 * Examples:
 * - 0 hours -> "Updated 0 hours ago"
 * - 1 hour -> "Updated 1 hour ago"
 * - 5 hours -> "Updated 5 hours ago"
 */
export function formatUpdatedTime(
  timestamp?: string | number | null,
  referenceNow?: number
): string {
  if (!timestamp) {
    return "Updated recently";
  }

  const date =
    typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "Updated recently";
  }

  const now = typeof referenceNow === "number" ? referenceNow : Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (hours === 1) {
    return "Updated 1 hour ago";
  }

  return `Updated ${hours} hours ago`;
}

/**
 * Checks if a saved repository's lastCheckedAt timestamp is older than 24 hours (or missing).
 */
export function isOlderThan24Hours(
  lastCheckedAt?: string | null,
  referenceNow?: number
): boolean {
  if (!lastCheckedAt) {
    return true;
  }

  const date = new Date(lastCheckedAt);
  if (isNaN(date.getTime())) {
    return true;
  }

  const now = typeof referenceNow === "number" ? referenceNow : Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  return now - date.getTime() >= TWENTY_FOUR_HOURS_MS;
}
