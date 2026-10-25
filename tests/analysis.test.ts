import { describe, it, expect } from "vitest";
import {
  selectPrimaryLanguage,
  validateApproach,
  validateConfidence,
  filterAndTruncateTree,
} from "../lib/analysis";

describe("selectPrimaryLanguage", () => {
  it("selects the language with the largest byte count", () => {
    const languages = {
      Python: 3000,
      "C++": 500000,
      C: 120000,
      CMake: 5000,
    };
    expect(selectPrimaryLanguage(languages)).toBe("C++");
  });

  it("returns null for empty languages object", () => {
    expect(selectPrimaryLanguage({})).toBeNull();
  });

  it("returns null for null or undefined input", () => {
    expect(selectPrimaryLanguage(null)).toBeNull();
    expect(selectPrimaryLanguage(undefined)).toBeNull();
  });

  it("handles a single language correctly", () => {
    expect(selectPrimaryLanguage({ Rust: 4096 })).toBe("Rust");
  });

  it("handles tie by picking a candidate with the winning byte count", () => {
    const languages = {
      C: 1000,
      "C++": 1000,
    };
    const result = selectPrimaryLanguage(languages);
    expect(["C", "C++"]).toContain(result);
  });
});

describe("validateApproach", () => {
  it("preserves valid approaches when confidence is high or medium", () => {
    expect(validateApproach("recompilation", "high")).toBe("recompilation");
    expect(validateApproach("decompilation", "medium")).toBe("decompilation");
    expect(validateApproach("reimplementation", "high")).toBe("reimplementation");
    expect(validateApproach("unknown", "high")).toBe("unknown");
  });

  it("converts invalid approach values to unknown", () => {
    expect(validateApproach("emulation", "high")).toBe("unknown");
    expect(validateApproach("port", "high")).toBe("unknown");
    expect(validateApproach(12345, "high")).toBe("unknown");
    expect(validateApproach(null, "high")).toBe("unknown");
    expect(validateApproach(undefined, "high")).toBe("unknown");
    expect(validateApproach("", "high")).toBe("unknown");
  });

  it("treats low confidence as unknown", () => {
    expect(validateApproach("recompilation", "low")).toBe("unknown");
    expect(validateApproach("decompilation", "low")).toBe("unknown");
    expect(validateApproach("reimplementation", "low")).toBe("unknown");
    expect(validateApproach("recompilation", "Low")).toBe("unknown");
    expect(validateApproach("decompilation", " LOW ")).toBe("unknown");
  });

  it("preserves valid approach when confidence is omitted or undefined", () => {
    expect(validateApproach("decompilation")).toBe("decompilation");
    expect(validateApproach("recompilation", undefined)).toBe("recompilation");
  });
});

describe("validateConfidence", () => {
  it("normalizes high, medium, and low confidence strings", () => {
    expect(validateConfidence("HIGH")).toBe("high");
    expect(validateConfidence(" Medium ")).toBe("medium");
    expect(validateConfidence("low")).toBe("low");
  });

  it("defaults to low for unrecognized or missing confidence values", () => {
    expect(validateConfidence("uncertain")).toBe("low");
    expect(validateConfidence(null)).toBe("low");
    expect(validateConfidence(undefined)).toBe("low");
  });
});

describe("filterAndTruncateTree", () => {
  it("drops excluded directories such as node_modules, vendor, third_party, and assets", () => {
    const paths = [
      "src/main.cpp",
      "node_modules/package/index.js",
      "vendor/lib/foo.c",
      "third_party/zlib/adler32.c",
      "thirdparty/glm/vec3.hpp",
      "assets/textures/player.png",
      "src/engine/loop.c",
    ];

    const result = filterAndTruncateTree(paths, 100);
    expect(result).toEqual(["src/main.cpp", "src/engine/loop.c"]);
  });

  it("drops binary and media file extensions", () => {
    const paths = [
      "src/main.c",
      "data/model.bin",
      "roms/game.z64",
      "music/bgm.ogg",
      "icon.ico",
      "build/app.exe",
      "lib/game.so",
      "src/renderer.cpp",
    ];

    const result = filterAndTruncateTree(paths, 100);
    expect(result).toEqual(["src/main.c", "src/renderer.cpp"]);
  });

  it("prioritizes paths containing signal keywords when truncating", () => {
    const normalPaths = Array.from({ length: 160 }, (_, i) => `src/file_${i}.c`);
    const signalPaths = [
      "tools/recomp/config.toml",
      "src/decomp_helper.h",
      "soh/fixbaserom.py",
      "src/pc/ultra_reimplementation.c",
      "ghidra/scripts/analyze.py",
    ];

    const allPaths = [...normalPaths, ...signalPaths];
    const result = filterAndTruncateTree(allPaths, 10);

    expect(result.length).toBe(10);
    // All 5 signal paths must be present because they are prioritized
    for (const sig of signalPaths) {
      expect(result).toContain(sig);
    }
  });

  it("handles empty or invalid inputs gracefully", () => {
    expect(filterAndTruncateTree([])).toEqual([]);
    expect(filterAndTruncateTree(null as any)).toEqual([]);
  });
});
