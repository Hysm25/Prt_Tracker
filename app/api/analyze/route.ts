import { NextRequest, NextResponse } from "next/server";
import { parseGitHubUrl, fetchGitHubRepoData } from "@/lib/github";
import { analyzeWithGemini } from "@/lib/gemini";
import { AnalyzeResponse, GitHubRepoMetadata, PortAnalysisResult } from "@/lib/types";

// In-memory cache for analyzed repositories (10-minute TTL)
interface CacheEntry {
  data: PortAnalysisResult;
  repo: GitHubRepoMetadata;
  cachedAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const repoCache = new Map<string, CacheEntry>();

/**
 * Periodically clears expired entries from the in-memory cache
 */
function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of repoCache.entries()) {
    if (now - entry.cachedAt > CACHE_TTL_MS) {
      repoCache.delete(key);
    }
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    let body: { url?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request payload. Please provide a JSON body with a 'url' property." },
        { status: 400 }
      );
    }

    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Repository URL is required. Please provide a valid GitHub repository link (e.g., https://github.com/TwilitRealm/dusk).",
        },
        { status: 400 }
      );
    }

    // 1. Validate GitHub URL and parse owner/repo
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid GitHub repository URL. The URL must point to a github.com repository (e.g., https://github.com/owner/repository).",
        },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;
    const cacheKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;

    // 2. Check 10-minute in-memory cache
    const cachedEntry = repoCache.get(cacheKey);
    const now = Date.now();

    if (cachedEntry && now - cachedEntry.cachedAt < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: cachedEntry.data,
        repo: cachedEntry.repo,
        cached: true,
      });
    }

    // 3. Verify GEMINI_API_KEY is present
    if (!process.env.GEMINI_API_KEY?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY is not configured on the server. Please set your GEMINI_API_KEY in .env.local to enable AI analysis.",
        },
        { status: 500 }
      );
    }

    // 4. Fetch GitHub repository metadata, raw README, and latest release
    let repoData;
    try {
      repoData = await fetchGitHubRepoData(owner, repo);
    } catch (githubError: unknown) {
      const message =
        githubError instanceof Error
          ? githubError.message
          : "Failed to fetch repository information from GitHub.";
      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 404 }
      );
    }

    // Fall back gracefully if README is missing
    if (!repoData.readme || repoData.readme.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No README file was found in "${owner}/${repo}". Game port analysis requires a README to identify the original game, platform compatibility, and port characteristics.`,
        },
        { status: 422 }
      );
    }

    // 5. Send repository information to Google Gemini 2.0 Flash
    let analysisResult: PortAnalysisResult;
    try {
      analysisResult = await analyzeWithGemini(repoData);
    } catch (geminiError: unknown) {
      const message =
        geminiError instanceof Error
          ? geminiError.message
          : "An unexpected error occurred during Gemini AI analysis.";
      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 502 }
      );
    }

    // 6. Cache successful result for 10 minutes
    if (repoCache.size > 100) {
      pruneCache();
    }

    repoCache.set(cacheKey, {
      data: analysisResult,
      repo: repoData.metadata,
      cachedAt: now,
    });

    return NextResponse.json({
      success: true,
      data: analysisResult,
      repo: repoData.metadata,
      cached: false,
    });
  } catch (unexpectedError: unknown) {
    console.error("Unhandled error in /api/analyze:", unexpectedError);
    const message =
      unexpectedError instanceof Error
        ? unexpectedError.message
        : "An internal server error occurred.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
