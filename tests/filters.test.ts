import { describe, it, expect } from "vitest";
import { filterSavedRepos } from "../lib/filters";
import { SavedRepoItem } from "../lib/types";

const mockRepos: SavedRepoItem[] = [
  {
    id: "twilitrealm/dusk",
    owner: "TwilitRealm",
    repo: "dusk",
    url: "https://github.com/TwilitRealm/dusk",
    analyzedAt: 1,
    result: {
      projectName: "Dusklight",
      originalGame: "The Legend of Zelda: Twilight Princess",
      language: "C++",
      approach: "decompilation",
      consoles: ["GameCube", "Wii"],
      platforms: ["Windows", "Linux", "macOS", "Android"],
      latestRelease: { version: "v2.0.3", date: "2026-10-20", downloadUrl: null },
    },
  },
  {
    id: "harbourmasters/shipwright",
    owner: "HarbourMasters",
    repo: "Shipwright",
    url: "https://github.com/HarbourMasters/Shipwright",
    analyzedAt: 2,
    result: {
      projectName: "Ship of Harkinian",
      originalGame: "The Legend of Zelda: Ocarina of Time",
      language: "C++",
      approach: "decompilation",
      consoles: ["N64"],
      platforms: ["Windows", "Linux", "Steam Deck", "Nintendo Switch"],
      latestRelease: { version: "v8.0.0", date: "2026-09-10", downloadUrl: null },
    },
  },
  {
    id: "open-goal/jak-project",
    owner: "open-goal",
    repo: "jak-project",
    url: "https://github.com/open-goal/jak-project",
    analyzedAt: 3,
    result: {
      projectName: "OpenGOAL",
      originalGame: "Jak and Daxter",
      language: "OpenGOAL",
      approach: "decompilation",
      consoles: ["PS2"],
      platforms: ["Windows", "Linux"],
      latestRelease: null,
    },
  },
  {
    id: "mr-clean/reimpl-engine",
    owner: "mr-clean",
    repo: "reimpl-engine",
    url: "https://github.com/mr-clean/reimpl-engine",
    analyzedAt: 4,
    result: {
      projectName: "Dreamcast Clean Engine",
      originalGame: "Sonic Adventure",
      language: "Rust",
      approach: "reimplementation",
      consoles: ["Dreamcast"],
      platforms: ["Windows"],
      latestRelease: null,
    },
  },
  {
    id: "old-user/no-meta",
    owner: "old-user",
    repo: "no-meta",
    url: "https://github.com/old-user/no-meta",
    analyzedAt: 5,
    result: {
      projectName: "Legacy Port",
      originalGame: "Retro Game",
      language: "unknown",
      approach: "unknown",
      consoles: [],
      platforms: [],
      latestRelease: null,
    },
  },
];

describe("filterSavedRepos", () => {
  it("returns all repositories when no filters are active", () => {
    const results = filterSavedRepos(mockRepos, {});
    expect(results.length).toBe(mockRepos.length);
  });

  describe("Port platforms filter (OR logic within group)", () => {
    it("filters by single port platform", () => {
      const results = filterSavedRepos(mockRepos, {
        platforms: ["Android"],
      });
      expect(results.map((r) => r.id)).toEqual(["twilitrealm/dusk"]);
    });

    it("filters using OR logic for multiple platforms", () => {
      const results = filterSavedRepos(mockRepos, {
        platforms: ["Android", "Steam Deck"],
      });
      expect(results.map((r) => r.id)).toEqual([
        "twilitrealm/dusk",
        "harbourmasters/shipwright",
      ]);
    });

    it("hides repositories with empty platforms when platform filter is active", () => {
      const results = filterSavedRepos(mockRepos, {
        platforms: ["Windows"],
      });
      // "old-user/no-meta" has empty platforms [], so it must be excluded
      expect(results.some((r) => r.id === "old-user/no-meta")).toBe(false);
    });
  });

  describe("Original consoles filter (OR logic within group)", () => {
    it("filters by single console", () => {
      const results = filterSavedRepos(mockRepos, {
        consoles: ["GameCube"],
      });
      expect(results.map((r) => r.id)).toEqual(["twilitrealm/dusk"]);
    });

    it("filters using OR logic for multiple consoles", () => {
      const results = filterSavedRepos(mockRepos, {
        consoles: ["PS2", "Dreamcast"],
      });
      expect(results.map((r) => r.id)).toEqual([
        "open-goal/jak-project",
        "mr-clean/reimpl-engine",
      ]);
    });

    it("hides repositories with empty consoles when console filter is active", () => {
      const results = filterSavedRepos(mockRepos, {
        consoles: ["N64"],
      });
      expect(results.some((r) => r.id === "old-user/no-meta")).toBe(false);
    });
  });

  describe("Approach filter (OR logic within group)", () => {
    it("filters by approach", () => {
      const results = filterSavedRepos(mockRepos, {
        approaches: ["reimplementation"],
      });
      expect(results.map((r) => r.id)).toEqual(["mr-clean/reimpl-engine"]);
    });

    it("filters using OR logic for multiple approaches", () => {
      const results = filterSavedRepos(mockRepos, {
        approaches: ["reimplementation", "unknown"],
      });
      expect(results.map((r) => r.id)).toEqual([
        "mr-clean/reimpl-engine",
        "old-user/no-meta",
      ]);
    });
  });

  describe("Compound filters (AND logic between groups)", () => {
    it("requires matching both platform AND console", () => {
      // Both Twilight Princess and Shipwright have Windows, but only Shipwright has N64
      const results = filterSavedRepos(mockRepos, {
        platforms: ["Windows"],
        consoles: ["N64"],
      });
      expect(results.map((r) => r.id)).toEqual(["harbourmasters/shipwright"]);
    });

    it("requires matching platform AND console AND approach", () => {
      const results = filterSavedRepos(mockRepos, {
        platforms: ["Windows"],
        consoles: ["Dreamcast"],
        approaches: ["reimplementation"],
      });
      expect(results.map((r) => r.id)).toEqual(["mr-clean/reimpl-engine"]);
    });

    it("returns empty array if no repository matches all active groups", () => {
      const results = filterSavedRepos(mockRepos, {
        platforms: ["Android"],
        consoles: ["PS2"], // Twilight Princess is on Android, but console is GameCube/Wii
      });
      expect(results.length).toBe(0);
    });
  });

  describe("Defensive error handling", () => {
    it("handles missing or malformed result objects without throwing", () => {
      const malformedRepos: any[] = [
        { id: "bad-1", url: "https://github.com/bad/1" },
        { id: "bad-2", url: "https://github.com/bad/2", result: null },
        { id: "bad-3", url: "https://github.com/bad/3", result: {} },
      ];
      expect(() =>
        filterSavedRepos(malformedRepos, {
          platforms: ["Windows"],
          consoles: ["PS2"],
          approaches: ["decompilation"],
        })
      ).not.toThrow();
    });
  });
});
