import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchLatestReleaseOnly } from "../lib/github";

describe("fetchLatestReleaseOnly", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("extracts version, date, and downloadUrl from latest release", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tag_name: "v1.2.3",
        name: "Release 1.2.3",
        published_at: "2026-10-25T10:00:00Z",
        html_url: "https://github.com/owner/repo/releases/v1.2.3",
        assets: [
          {
            name: "game-port-v1.2.3.zip",
            browser_download_url: "https://github.com/owner/repo/releases/download/v1.2.3/game-port-v1.2.3.zip",
            size: 1048576,
          },
        ],
      }),
    } as Response);

    const result = await fetchLatestReleaseOnly("owner", "repo");
    expect(result).toEqual({
      version: "v1.2.3",
      date: "2026-10-25",
      downloadUrl: "https://github.com/owner/repo/releases/download/v1.2.3/game-port-v1.2.3.zip",
    });
  });

  it("returns null when repository has no releases (404)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    const result = await fetchLatestReleaseOnly("owner", "no-releases");
    expect(result).toBeNull();
  });

  it("falls back to html_url when release has no assets", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tag_name: "v2.0",
        published_at: "2026-09-01T12:00:00Z",
        html_url: "https://github.com/owner/repo/releases/tag/v2.0",
        assets: [],
      }),
    } as Response);

    const result = await fetchLatestReleaseOnly("owner", "repo");
    expect(result).toEqual({
      version: "v2.0",
      date: "2026-09-01",
      downloadUrl: "https://github.com/owner/repo/releases/tag/v2.0",
    });
  });

  it("throws on rate limit (403)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      headers: new Headers({ "x-ratelimit-remaining": "0" }),
    } as Response);

    await expect(fetchLatestReleaseOnly("owner", "repo")).rejects.toThrow(
      /rate limit/i
    );
  });
});
