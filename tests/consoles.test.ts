import { describe, it, expect } from "vitest";
import { normalizeConsoles, KNOWN_CONSOLES } from "../lib/consoles";

describe("normalizeConsoles", () => {
  it("normalizes canonical names regardless of case", () => {
    expect(normalizeConsoles(["gamecube", "N64", "ps2"])).toEqual([
      "GameCube",
      "N64",
      "PS2",
    ]);
  });

  it("maps common alias variations back to canonical console names", () => {
    expect(normalizeConsoles(["Nintendo 64"])).toEqual(["N64"]);
    expect(normalizeConsoles(["super nintendo"])).toEqual(["SNES"]);
    expect(normalizeConsoles(["playstation 2"])).toEqual(["PS2"]);
    expect(normalizeConsoles(["game boy advance"])).toEqual(["Game Boy / GBA"]);
    expect(normalizeConsoles(["sega genesis"])).toEqual(["Genesis / Mega Drive"]);
    expect(normalizeConsoles(["nintendo wii u"])).toEqual(["Wii U"]);
    expect(normalizeConsoles(["xbox series x"])).toEqual(["Xbox Series X|S"]);
  });

  it("deduplicates aliases that map to the same console", () => {
    const result = normalizeConsoles(["ps1", "playstation", "psx", "PlayStation 1"]);
    expect(result).toEqual(["PS1"]);
  });

  it("handles empty arrays and non-matching entries gracefully", () => {
    expect(normalizeConsoles([])).toEqual([]);
    expect(normalizeConsoles(["NonExistentConsoleXYZ"])).toEqual([]);
    // @ts-expect-error test non-array input
    expect(normalizeConsoles(null)).toEqual([]);
  });

  it("exports a non-empty canonical KNOWN_CONSOLES list", () => {
    expect(KNOWN_CONSOLES.length).toBeGreaterThan(15);
    expect(KNOWN_CONSOLES).toContain("GameCube");
    expect(KNOWN_CONSOLES).toContain("PS2");
    expect(KNOWN_CONSOLES).toContain("Dreamcast");
  });
});
