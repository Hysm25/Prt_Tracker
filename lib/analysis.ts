import { PortApproach, ConfidenceLevel } from "./types";

const VALID_APPROACHES: readonly PortApproach[] = [
  "recompilation",
  "decompilation",
  "reimplementation",
  "unknown",
] as const;

/**
 * Patterns matching directory segments that should be excluded from the file tree context.
 */
export const DROPPED_DIR_PATTERNS =
  /(?:^|\/)(?:node_modules|vendor|third_party|thirdparty|3rdparty|assets)(?:\/|$)/i;

/**
 * Common binary/media/asset file extensions that should be excluded from the file tree context.
 */
export const BINARY_EXTENSIONS =
  /\.(?:png|jpe?g|gif|ico|bmp|webp|svg|psd|ai|mp3|wav|ogg|flac|aac|m4a|midi?|mp4|mkv|avi|mov|webm|exe|dll|so|dylib|o|obj|a|lib|class|jar|wasm|iso|bin|rom|z64|n64|v64|wad|dol|elf|gcm|ciso|wbfs|xex|zip|tar|gz|7z|rar|xz|bz2|tgz|deb|rpm|apk|ipa|pdf|ttf|otf|woff2?|eot|db|sqlite|dat|pak)$/i;

/**
 * High-value keywords in file/folder paths that strongly signal the porting approach.
 */
export const SIGNAL_KEYWORDS_PATTERN =
  /(?:recomp|decomp|ghidra|reimpl|orig|baserom)/i;

/**
 * Determines the primary programming language from a GitHub languages map (language -> byte count).
 * Returns the language name with the largest byte count, or null if the map is empty or invalid.
 */
export function selectPrimaryLanguage(
  languages: Record<string, number> | null | undefined
): string | null {
  if (!languages || typeof languages !== "object") {
    return null;
  }

  let topLanguage: string | null = null;
  let maxBytes = -1;

  for (const [lang, bytes] of Object.entries(languages)) {
    if (typeof bytes === "number" && bytes > maxBytes) {
      maxBytes = bytes;
      topLanguage = lang;
    }
  }

  return topLanguage;
}

/**
 * Validates the approach and confidence returned by Gemini.
 * - Low confidence is treated as "unknown".
 * - Invalid approach strings default to "unknown".
 */
export function validateApproach(
  rawApproach: unknown,
  rawConfidence?: unknown
): PortApproach {
  // Treat "low" confidence as "unknown" in code
  if (
    typeof rawConfidence === "string" &&
    rawConfidence.trim().toLowerCase() === "low"
  ) {
    return "unknown";
  }

  if (typeof rawApproach === "string") {
    const cleanApproach = rawApproach.trim().toLowerCase();
    if (
      cleanApproach === "recompilation" ||
      cleanApproach === "decompilation" ||
      cleanApproach === "reimplementation"
    ) {
      return cleanApproach as PortApproach;
    }
  }

  return "unknown";
}

/**
 * Validates the confidence string ("high" | "medium" | "low").
 * Defaults to "low" if missing or unrecognized.
 */
export function validateConfidence(rawConfidence: unknown): ConfidenceLevel {
  if (typeof rawConfidence === "string") {
    const clean = rawConfidence.trim().toLowerCase();
    if (clean === "high" || clean === "medium" || clean === "low") {
      return clean as ConfidenceLevel;
    }
  }
  return "low";
}

/**
 * Filters repository tree file paths:
 * - Drops paths under node_modules, vendor, third_party, assets
 * - Drops binary, media, and asset files
 * - Truncates to about 150 entries while prioritizing files containing strong signal keywords
 */
export function filterAndTruncateTree(
  paths: string[],
  limit = 150
): string[] {
  if (!Array.isArray(paths)) {
    return [];
  }

  // 1. Drop unwanted directories and binary extensions
  const filtered = paths.filter((path) => {
    if (!path || typeof path !== "string") return false;
    if (DROPPED_DIR_PATTERNS.test(path)) return false;
    if (BINARY_EXTENSIONS.test(path)) return false;
    return true;
  });

  if (filtered.length <= limit) {
    return filtered;
  }

  // 2. Separate paths that have strong signals from regular files
  const signalPaths: string[] = [];
  const normalPaths: string[] = [];

  for (const p of filtered) {
    if (SIGNAL_KEYWORDS_PATTERN.test(p)) {
      signalPaths.push(p);
    } else {
      normalPaths.push(p);
    }
  }

  // 3. Keep all signal paths (up to limit) and fill remaining space with normal paths
  const prioritized = [...signalPaths, ...normalPaths];
  return prioritized.slice(0, limit);
}
