import { describe, it, expect } from "vitest";
import { formatUpdatedTime, isOlderThan24Hours } from "../lib/time";

describe("lib/time", () => {
  describe("formatUpdatedTime", () => {
    it("returns 'Updated 0 hours ago' for current time", () => {
      const now = Date.now();
      expect(formatUpdatedTime(new Date(now).toISOString(), now)).toBe(
        "Updated 0 hours ago"
      );
    });

    it("returns 'Updated 1 hour ago' for 1 hour ago", () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      expect(formatUpdatedTime(new Date(oneHourAgo).toISOString(), now)).toBe(
        "Updated 1 hour ago"
      );
    });

    it("returns 'Updated 5 hours ago' for 5 hours ago", () => {
      const now = Date.now();
      const fiveHoursAgo = now - 5 * 60 * 60 * 1000;
      expect(formatUpdatedTime(new Date(fiveHoursAgo).toISOString(), now)).toBe(
        "Updated 5 hours ago"
      );
    });

    it("returns 'Updated 26 hours ago' for 26 hours ago", () => {
      const now = Date.now();
      const past = now - 26 * 60 * 60 * 1000;
      expect(formatUpdatedTime(new Date(past).toISOString(), now)).toBe(
        "Updated 26 hours ago"
      );
    });

    it("handles missing or invalid timestamps gracefully", () => {
      expect(formatUpdatedTime(null)).toBe("Updated recently");
      expect(formatUpdatedTime(undefined)).toBe("Updated recently");
      expect(formatUpdatedTime("invalid-date")).toBe("Updated recently");
    });
  });

  describe("isOlderThan24Hours", () => {
    it("returns true if timestamp is missing", () => {
      expect(isOlderThan24Hours(null)).toBe(true);
      expect(isOlderThan24Hours(undefined)).toBe(true);
    });

    it("returns true if timestamp is older than 24 hours", () => {
      const now = 100_000_000;
      const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
      expect(
        isOlderThan24Hours(new Date(twentyFiveHoursAgo).toISOString(), now)
      ).toBe(true);
    });

    it("returns false if timestamp is within 24 hours", () => {
      const now = 100_000_000;
      const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
      expect(
        isOlderThan24Hours(new Date(twelveHoursAgo).toISOString(), now)
      ).toBe(false);
    });
  });
});
