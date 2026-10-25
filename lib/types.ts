/**
 * Types for Game Port Analyzer
 */

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
  platforms: string[]; // e.g. ["Windows", "Linux", "macOS", "Steam Deck"]
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
