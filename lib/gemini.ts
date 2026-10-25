import { GitHubRepoData, PortAnalysisResult, PortApproach } from "./types";
import { normalizeConsoles, KNOWN_CONSOLES } from "./consoles";

const VALID_APPROACHES: readonly PortApproach[] = [
  "recompilation",
  "decompilation",
  "reimplementation",
  "unknown",
] as const;

/**
 * Strips markdown code fences (e.g. ```json ... ```) from a text response.
 */
function cleanJsonText(rawText: string): string {
  let cleaned = rawText.trim();

  // Strip leading code fences like ```json or ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");

  // Strip trailing code fences
  cleaned = cleaned.replace(/\s*```$/i, "");

  return cleaned.trim();
}

/**
 * Analyzes repository data using Google Gemini to extract structured
 * information regarding the unofficial game port project, including language and approach.
 */
export async function analyzeWithGemini(
  repoData: GitHubRepoData
): Promise<PortAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not configured on the server. Please add GEMINI_API_KEY to your .env.local file."
    );
  }

  // Format release details for the prompt
  let releaseSummary = "No releases available in repository.";
  if (repoData.release) {
    const assetsList =
      repoData.release.assets.length > 0
        ? repoData.release.assets
            .map((a) => `${a.name} (${a.downloadUrl})`)
            .join(", ")
        : "No downloadable binary assets attached";

    releaseSummary = `
- Tag: ${repoData.release.tagName}
- Name: ${repoData.release.name || "N/A"}
- Published Date: ${repoData.release.publishedAt}
- Release URL: ${repoData.release.htmlUrl}
- Assets: ${assetsList}
`.trim();
  }

  // Cap README length to avoid unnecessary token consumption while preserving key content
  const truncatedReadme = repoData.readme
    ? repoData.readme.slice(0, 45000)
    : "No README file provided in this repository.";

  const prompt = `
You are an expert software engineer and video game archivist analyzing a GitHub repository for an unofficial video game port or decompilation project.

Examine the following repository metadata, README documentation, and latest release information. Extract the project's details and return ONLY a valid JSON object matching the requested schema.

### REPOSITORY METADATA
- Full Name: ${repoData.metadata.fullName}
- Description: ${repoData.metadata.description || "None"}
- Topics: ${repoData.metadata.topics.join(", ") || "None"}
- Homepage: ${repoData.metadata.homepage || "None"}

### LATEST RELEASE
${releaseSummary}

### README CONTENT
${truncatedReadme}

### REQUIRED OUTPUT FORMAT
Return ONLY valid JSON (no markdown fences, no conversational preamble or postscript) conforming to this exact shape:
{
  "projectName": string,
  "originalGame": string,
  "language": string,
  "approach": "recompilation" | "decompilation" | "reimplementation" | "unknown",
  "consoles": string[],
  "platforms": string[],
  "latestRelease": {
    "version": string,
    "date": string,
    "downloadUrl": string | null
  } | null
}

### EXTRACTION RULES:
1. "projectName": The official name of this port / engine recreation / decomp project (e.g. "Dusklight", "Ship of Harkinian", "OpenGOAL", "sm64ex", "OpenMW"). If ambiguous, use the repository name.
2. "originalGame": The original commercial video game being ported or reimplemented (e.g. "The Legend of Zelda: Twilight Princess", "The Legend of Zelda: Ocarina of Time", "Jak and Daxter: The Precursor Legacy", "Super Mario 64", "The Elder Scrolls III: Morrowind").
3. "language": Main programming language of the port project (e.g. "C++", "C", "Rust", "C#", "Go", "Python"), or "unknown". Base this ONLY on the README, description, topics, and release info provided. Answer "unknown" rather than guessing.
4. "approach": Exactly one of: "recompilation", "decompilation", "reimplementation", "unknown".
   - "recompilation": static/binary recompilation from original executable or bytecode.
   - "decompilation": reverse-engineered source matching original binaries.
   - "reimplementation": recreation/rewrite of the game engine or mechanics.
   - "unknown": not clearly specified.
   Base this ONLY on the README, description, topics, and release info provided. Answer "unknown" rather than guessing.
5. "consoles": Array of original retro console(s) or hardware systems that the original game was released on historically (e.g. ["GameCube", "Wii"] for Twilight Princess, ["N64"] for Super Mario 64, ["PS2"] for Jak and Daxter, ["PS1"] for Metal Gear Solid). Pick from or match these canonical names:
   ${KNOWN_CONSOLES.join(", ")}
6. "platforms": An array of target operating systems and platforms supported or targeted by this PORT project (e.g. ["Windows", "Linux", "macOS", "Steam Deck", "Android", "iOS", "Nintendo Switch", "PS Vita"]). Keep these separate from original console releases.
7. "latestRelease":
   - If a latest release exists in the repository data, populate:
     - "version": the version string or tag (e.g. "v2.0.3").
     - "date": the release date in a clean readable format (e.g. "YYYY-MM-DD" or "Month DD, YYYY").
     - "downloadUrl": the most relevant direct downloadable asset URL (e.g. .exe, .zip, .AppImage, .apk, .dmg) if available; otherwise use the release page URL.
   - If there is NO release in the repository data, set "latestRelease" to null.
`.trim();

  // Determine model: default to "gemini-3.5-flash-lite", overridable via GEMINI_MODEL env var
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(geminiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });
  } catch (networkError: unknown) {
    const errorMsg =
      networkError instanceof Error ? networkError.message : "Network error";
    throw new Error(`Failed to communicate with Google Gemini API: ${errorMsg}`);
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errJson = await response.json();
      errorDetail =
        errJson.error?.message || JSON.stringify(errJson.error) || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(
      `Gemini API error (${response.status}): ${errorDetail || "Unknown Gemini API error"}`
    );
  }

  const resultJson = await response.json();
  const rawText =
    resultJson.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText || typeof rawText !== "string") {
    throw new Error(
      "Gemini returned an empty response or invalid content candidate."
    );
  }

  // Parse the Gemini JSON safely
  const cleanedText = cleanJsonText(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (parseError: unknown) {
    const msg =
      parseError instanceof Error ? parseError.message : "JSON syntax error";
    throw new Error(`Failed to parse Gemini output as JSON (${msg}): ${cleanedText.slice(0, 200)}...`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Gemini response is not a valid JSON object.");
  }

  const resultObj = parsed as Record<string, unknown>;

  // Normalize and validate the output shape
  const projectName =
    typeof resultObj.projectName === "string" && resultObj.projectName.trim()
      ? resultObj.projectName.trim()
      : repoData.metadata.name;

  const originalGame =
    typeof resultObj.originalGame === "string" && resultObj.originalGame.trim()
      ? resultObj.originalGame.trim()
      : "Unknown Game";

  // Validate language (defaults to "unknown")
  const language =
    typeof resultObj.language === "string" && resultObj.language.trim()
      ? resultObj.language.trim()
      : "unknown";

  // Validate approach (must be one of VALID_APPROACHES, defaults to "unknown")
  let approach: PortApproach = "unknown";
  if (typeof resultObj.approach === "string") {
    const cleanApproach = resultObj.approach.trim().toLowerCase();
    if (VALID_APPROACHES.includes(cleanApproach as PortApproach)) {
      approach = cleanApproach as PortApproach;
    }
  }

  // Validate consoles against the canonical KNOWN_CONSOLES list
  const rawConsoles = Array.isArray(resultObj.consoles)
    ? resultObj.consoles
    : [];
  const consoles = normalizeConsoles(rawConsoles);

  const rawPlatforms = Array.isArray(resultObj.platforms)
    ? resultObj.platforms
    : [];

  const platforms = rawPlatforms
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .map((p) => p.trim());

  // Default to at least PC if empty
  if (platforms.length === 0) {
    platforms.push("PC");
  }

  // Deduplicate platforms
  const uniquePlatforms = Array.from(new Set(platforms));

  let latestRelease: PortAnalysisResult["latestRelease"] = null;

  if (
    repoData.release &&
    resultObj.latestRelease &&
    typeof resultObj.latestRelease === "object"
  ) {
    const relObj = resultObj.latestRelease as Record<string, unknown>;
    const version =
      typeof relObj.version === "string" && relObj.version.trim()
        ? relObj.version.trim()
        : repoData.release.tagName;

    const date =
      typeof relObj.date === "string" && relObj.date.trim()
        ? relObj.date.trim()
        : repoData.release.publishedAt.slice(0, 10);

    const downloadUrl =
      typeof relObj.downloadUrl === "string" && relObj.downloadUrl.trim()
        ? relObj.downloadUrl.trim()
        : repoData.release.assets[0]?.downloadUrl || repoData.release.htmlUrl;

    latestRelease = {
      version,
      date,
      downloadUrl: downloadUrl || null,
    };
  } else if (!repoData.release) {
    latestRelease = null;
  }

  return {
    projectName,
    originalGame,
    language,
    approach,
    consoles,
    platforms: uniquePlatforms,
    latestRelease,
  };
}
