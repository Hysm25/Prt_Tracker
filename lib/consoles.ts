/**
 * Canonical list of original gaming consoles and retro platforms
 * that classic games were released on.
 */
export const KNOWN_CONSOLES = [
  "NES",
  "SNES",
  "N64",
  "GameCube",
  "Wii",
  "Wii U",
  "Nintendo Switch",
  "Game Boy / GBA",
  "Nintendo DS",
  "Nintendo 3DS",
  "PS1",
  "PS2",
  "PS3",
  "PS4",
  "PS5",
  "PSP",
  "PS Vita",
  "Xbox",
  "Xbox 360",
  "Xbox One",
  "Xbox Series X|S",
  "Dreamcast",
  "Saturn",
  "Genesis / Mega Drive",
  "Arcade",
  "PC / DOS",
] as const;

export type ConsoleName = (typeof KNOWN_CONSOLES)[number];

/**
 * Normalization map for common alias variations returned by LLMs
 */
const CONSOLE_ALIASES: Record<string, ConsoleName> = {
  // Nintendo
  "nes": "NES",
  "nintendo entertainment system": "NES",
  "famicom": "NES",
  "snes": "SNES",
  "super nes": "SNES",
  "super nintendo": "SNES",
  "super famicom": "SNES",
  "n64": "N64",
  "nintendo 64": "N64",
  "gamecube": "GameCube",
  "nintendo gamecube": "GameCube",
  "gc": "GameCube",
  "ngc": "GameCube",
  "wii": "Wii",
  "nintendo wii": "Wii",
  "wii u": "Wii U",
  "wiiu": "Wii U",
  "nintendo wii u": "Wii U",
  "switch": "Nintendo Switch",
  "nintendo switch": "Nintendo Switch",
  "ns": "Nintendo Switch",
  "game boy": "Game Boy / GBA",
  "gameboy": "Game Boy / GBA",
  "game boy color": "Game Boy / GBA",
  "gbc": "Game Boy / GBA",
  "gba": "Game Boy / GBA",
  "game boy advance": "Game Boy / GBA",
  "game boy / gba": "Game Boy / GBA",
  "ds": "Nintendo DS",
  "nds": "Nintendo DS",
  "nintendo ds": "Nintendo DS",
  "3ds": "Nintendo 3DS",
  "n3ds": "Nintendo 3DS",
  "nintendo 3ds": "Nintendo 3DS",

  // Sony PlayStation
  "ps1": "PS1",
  "psx": "PS1",
  "playstation": "PS1",
  "playstation 1": "PS1",
  "playstation one": "PS1",
  "ps2": "PS2",
  "playstation 2": "PS2",
  "ps3": "PS3",
  "playstation 3": "PS3",
  "ps4": "PS4",
  "playstation 4": "PS4",
  "ps5": "PS5",
  "playstation 5": "PS5",
  "psp": "PSP",
  "playstation portable": "PSP",
  "ps vita": "PS Vita",
  "vita": "PS Vita",
  "psvita": "PS Vita",
  "playstation vita": "PS Vita",

  // Microsoft Xbox
  "xbox": "Xbox",
  "original xbox": "Xbox",
  "xbox 360": "Xbox 360",
  "x360": "Xbox 360",
  "xbox one": "Xbox One",
  "xone": "Xbox One",
  "xbox series": "Xbox Series X|S",
  "xbox series x": "Xbox Series X|S",
  "xbox series s": "Xbox Series X|S",
  "xbox series x|s": "Xbox Series X|S",
  "xbox series x/s": "Xbox Series X|S",

  // Sega
  "dreamcast": "Dreamcast",
  "sega dreamcast": "Dreamcast",
  "saturn": "Saturn",
  "sega saturn": "Saturn",
  "genesis": "Genesis / Mega Drive",
  "mega drive": "Genesis / Mega Drive",
  "megadrive": "Genesis / Mega Drive",
  "sega genesis": "Genesis / Mega Drive",
  "sega mega drive": "Genesis / Mega Drive",
  "genesis / mega drive": "Genesis / Mega Drive",

  // Others
  "arcade": "Arcade",
  "coin-op": "Arcade",
  "pc": "PC / DOS",
  "dos": "PC / DOS",
  "ms-dos": "PC / DOS",
  "pc / dos": "PC / DOS",
};

/**
 * Validates and normalizes raw console names against the canonical KNOWN_CONSOLES list.
 */
export function normalizeConsoles(rawConsoles: unknown[]): string[] {
  if (!Array.isArray(rawConsoles)) {
    return [];
  }

  const normalizedSet = new Set<string>();

  for (const item of rawConsoles) {
    if (typeof item !== "string") continue;
    const clean = item.trim().toLowerCase();
    if (!clean) continue;

    // Check direct alias lookup
    if (CONSOLE_ALIASES[clean]) {
      normalizedSet.add(CONSOLE_ALIASES[clean]);
      continue;
    }

    // Check case-insensitive exact match in KNOWN_CONSOLES
    const matched = KNOWN_CONSOLES.find(
      (c) => c.toLowerCase() === clean
    );
    if (matched) {
      normalizedSet.add(matched);
      continue;
    }

    // Check partial alias matching (using word boundaries for short abbreviations)
    for (const [alias, canonical] of Object.entries(CONSOLE_ALIASES)) {
      if (alias.length <= 3) {
        const regex = new RegExp(`(^|[^a-z0-9])${alias}([^a-z0-9]|$)`, "i");
        if (regex.test(clean)) {
          normalizedSet.add(canonical);
          break;
        }
      } else if (clean.includes(alias)) {
        normalizedSet.add(canonical);
        break;
      }
    }
  }

  return Array.from(normalizedSet);
}
