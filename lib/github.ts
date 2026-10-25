import { GitHubRepoData, GitHubRepoMetadata, GitHubReleaseData } from "./types";

/**
 * Validates and extracts owner and repo name from a GitHub URL string.
 * Supports standard URLs, tree/blob subpaths, trailing slashes, and .git endings.
 *
 * Examples:
 * - https://github.com/TwilitRealm/dusk
 * - https://github.com/TwilitRealm/dusk.git
 * - https://www.github.com/TwilitRealm/dusk/tree/main
 * - github.com/TwilitRealm/dusk
 */
export function parseGitHubUrl(rawUrl: string): { owner: string; repo: string } | null {
  if (!rawUrl || typeof rawUrl !== "string") {
    return null;
  }

  const trimmed = rawUrl.trim();

  // Pattern matches optional protocol, optional www., github.com/, owner, and repo
  const githubPattern =
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/.*)?$/i;

  const match = trimmed.match(githubPattern);
  if (!match) {
    return null;
  }

  const owner = match[1];
  let repo = match[2];

  // Strip .git extension if present
  if (repo.endsWith(".git")) {
    repo = repo.slice(0, -4);
  }

  // Basic validation on owner and repo names
  if (!owner || !repo || owner.length > 100 || repo.length > 100) {
    return null;
  }

  return { owner, repo };
}

/**
 * Creates standard HTTP headers for GitHub API requests, adding authorization
 * if GITHUB_TOKEN is available in the environment for 5,000 req/hr limits.
 */
function getGitHubHeaders(customAccept?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: customAccept || "application/vnd.github+json",
    "User-Agent": "GamePortAnalyzer-NextApp/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fetches repository metadata, README markdown, and the latest release from GitHub REST API.
 */
export async function fetchGitHubRepoData(
  owner: string,
  repo: string
): Promise<GitHubRepoData> {
  const headers = getGitHubHeaders();

  // 1. Fetch Repository Metadata
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    // GitHub API requests can redirect (e.g. repo rename); follow automatically
    redirect: "follow",
    next: { revalidate: 0 },
  });

  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      throw new Error(
        `Repository "${owner}/${repo}" was not found on GitHub. Verify that the repository exists and is public.`
      );
    }
    if (repoRes.status === 403 || repoRes.status === 429) {
      const rateLimitRemaining = repoRes.headers.get("x-ratelimit-remaining");
      if (rateLimitRemaining === "0") {
        throw new Error(
          "GitHub API rate limit exceeded. Please configure an optional GITHUB_TOKEN in .env.local to increase your limit to 5,000 requests/hour."
        );
      }
    }
    throw new Error(
      `GitHub API error (${repoRes.status}): ${repoRes.statusText}`
    );
  }

  const repoJson = await repoRes.json();

  const metadata: GitHubRepoMetadata = {
    name: repoJson.name || repo,
    fullName: repoJson.full_name || `${owner}/${repo}`,
    description: repoJson.description || null,
    topics: Array.isArray(repoJson.topics) ? repoJson.topics : [],
    homepage: repoJson.homepage || null,
    htmlUrl: repoJson.html_url || `https://github.com/${owner}/${repo}`,
    stars: repoJson.stargazers_count ?? 0,
    forks: repoJson.forks_count ?? 0,
    openIssues: repoJson.open_issues_count ?? 0,
    owner: {
      login: repoJson.owner?.login || owner,
      avatarUrl: repoJson.owner?.avatar_url || "",
      htmlUrl: repoJson.owner?.html_url || `https://github.com/${owner}`,
    },
  };

  // 2. Fetch README (Raw Markdown)
  let readme: string | null = null;
  try {
    const readmeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: getGitHubHeaders("application/vnd.github.raw+json"),
        redirect: "follow",
        next: { revalidate: 0 },
      }
    );

    if (readmeRes.ok) {
      readme = await readmeRes.text();
    } else if (readmeRes.status !== 404) {
      console.warn(
        `Failed to fetch README for ${owner}/${repo}: ${readmeRes.status} ${readmeRes.statusText}`
      );
    }
  } catch (err) {
    console.warn(`Error fetching README for ${owner}/${repo}:`, err);
  }

  // 3. Fetch Latest Release (if any exists)
  let release: GitHubReleaseData | null = null;
  try {
    const releaseRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      {
        headers,
        redirect: "follow",
        next: { revalidate: 0 },
      }
    );

    if (releaseRes.ok) {
      const releaseJson = await releaseRes.json();
      const assets = Array.isArray(releaseJson.assets)
        ? releaseJson.assets.map((asset: { name: string; browser_download_url: string; size: number }) => ({
            name: asset.name,
            downloadUrl: asset.browser_download_url,
            size: asset.size,
          }))
        : [];

      release = {
        tagName: releaseJson.tag_name || "Latest",
        name: releaseJson.name || null,
        publishedAt: releaseJson.published_at || new Date().toISOString(),
        htmlUrl: releaseJson.html_url || `https://github.com/${owner}/${repo}/releases`,
        assets,
      };
    } else if (releaseRes.status !== 404) {
      console.warn(
        `Failed to fetch latest release for ${owner}/${repo}: ${releaseRes.status}`
      );
    }
  } catch (err) {
    console.warn(`Error fetching release for ${owner}/${repo}:`, err);
  }

  return {
    metadata,
    readme,
    release,
  };
}
