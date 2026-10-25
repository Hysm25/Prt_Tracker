import { NextRequest, NextResponse } from "next/server";
import { parseGitHubUrl, fetchLatestReleaseOnly } from "@/lib/github";
import { ReleaseResponse } from "@/lib/types";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ReleaseResponse>> {
  try {
    let body: { owner?: unknown; repo?: unknown; url?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          latestRelease: null,
          error: "Invalid request payload. Expected JSON body.",
        },
        { status: 400 }
      );
    }

    let owner: string | undefined;
    let repo: string | undefined;

    if (typeof body.url === "string" && body.url.trim()) {
      const parsed = parseGitHubUrl(body.url.trim());
      if (parsed) {
        owner = parsed.owner;
        repo = parsed.repo;
      }
    }

    if (!owner && typeof body.owner === "string" && typeof body.repo === "string") {
      owner = body.owner.trim();
      repo = body.repo.trim();
    }

    if (!owner || !repo) {
      return NextResponse.json(
        {
          success: false,
          latestRelease: null,
          error: "Both owner and repo (or a valid repository url) are required.",
        },
        { status: 400 }
      );
    }

    const latestRelease = await fetchLatestReleaseOnly(owner, repo);
    const lastCheckedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      latestRelease,
      lastCheckedAt,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch latest release.";
    console.warn("Error refreshing release in /api/release:", message);

    return NextResponse.json(
      {
        success: false,
        latestRelease: null,
        error: message,
      },
      { status: 500 }
    );
  }
}
