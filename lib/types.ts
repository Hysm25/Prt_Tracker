/**
 * Types for Game Port Analyzer
 */

/**
 * Porting approaches/methodologies for unofficial video game ports
 */
export type PortApproach =
  | "recompilation"
  | "decompilation"
  | "reimplementation"
  | "unknown";

/**
 * Confidence level in the detected porting approach
 */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Information regarding the latest release of the game port
 */
export interface LatestRelease {
  version: string;
  date: string;
  downloadUrl: string | null;
}

/**
 * Structure of the analyzed game port result returned by Gemini
 */
export interface PortAnalysisResult {
  projectName: string;
  originalGame: string;
  language: string; // main programming language, or "unknown"
  approach: PortApproach; // exactly one of "recompilation", "decompilation", "reimplementation", "unknown"
  approachEvidence?: string | null; // quote of <= 20 words or path from repo supporting the approach
  confidence?: ConfidenceLevel; // "high" | "medium" | "low"
  consoles: string[]; // Original console(s) the game released on, e.g. ["N64", "GameCube"]
  platforms: string[]; // Target ports, e.g. ["Windows", "Linux", "macOS", "Steam Deck"]
  latestRelease: LatestRelease | null;
}

/**
 * Metadata fetched from GitHub REST API
 */
export interface GitHubRepoMetadata {
  name: string;
  fullName: string;
  description: string | null;
  topics: string[];
  homepage: string | null;
  htmlUrl: string;
  defaultBranch?: string;
  stars: number;
  forks: number;
  openIssues: number;
  owner: {
    login: string;
    avatarUrl: string;
    htmlUrl: string;
  };
}

/**
 * Latest release details fetched from GitHub REST API
 */
export interface GitHubReleaseData {
  tagName: string;
  name: string | null;
  publishedAt: string;
  htmlUrl: string;
  assets: Array<{
    name: string;
    downloadUrl: string;
    size: number;
  }>;
}

/**
 * Aggregate GitHub repository data ready for analysis
 */
export interface GitHubRepoData {
  metadata: GitHubRepoMetadata;
  readme: string | null;
  release: GitHubReleaseData | null;
  languages?: Record<string, number>;
  primaryLanguage?: string | null;
  fileTree?: string[];
}

/**
 * API response structure for /api/analyze
 */
export interface AnalyzeResponse {
  success: boolean;
  data?: PortAnalysisResult;
  repo?: GitHubRepoMetadata;
  cached?: boolean;
  error?: string;
}

/**
 * API response structure for /api/release
 */
export interface ReleaseResponse {
  success: boolean;
  latestRelease: LatestRelease | null;
  lastCheckedAt?: string;
  error?: string;
}

/**
 * Structure for repositories saved in localStorage
 */
export interface SavedRepoItem {
  id: string; // unique lowercase key e.g. "twilitrealm/dusk"
  owner: string;
  repo: string;
  url: string;
  analyzedAt: number;
  lastCheckedAt?: string; // ISO timestamp string of the last release check
  result: PortAnalysisResult;
  repoMetadata?: GitHubRepoMetadata;
}
