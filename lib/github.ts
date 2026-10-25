import {
  GitHubRepoData,
  GitHubRepoMetadata,
  GitHubReleaseData,
  LatestRelease,
} from "./types";
import { selectPrimaryLanguage, filterAndTruncateTree } from "./analysis";

export { selectPrimaryLanguage, filterAndTruncateTree };

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

  const defaultBranch = repoJson.default_branch || "main";

  const metadata: GitHubRepoMetadata = {
    name: repoJson.name || repo,
    fullName: repoJson.full_name || `${owner}/${repo}`,
    description: repoJson.description || null,
    topics: Array.isArray(repoJson.topics) ? repoJson.topics : [],
    homepage: repoJson.homepage || null,
    htmlUrl: repoJson.html_url || `https://github.com/${owner}/${repo}`,
    defaultBranch,
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

  // 4. Fetch Languages (GET /repos/{owner}/{repo}/languages)
  let languages: Record<string, number> = {};
  let primaryLanguage: string | null = null;
  try {
    const langRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
      {
        headers,
        redirect: "follow",
        next: { revalidate: 0 },
      }
    );

    if (langRes.ok) {
      languages = await langRes.json();
      primaryLanguage = selectPrimaryLanguage(languages);
    } else {
      console.warn(
        `Failed to fetch languages for ${owner}/${repo}: ${langRes.status}`
      );
    }
  } catch (err) {
    console.warn(`Error fetching languages for ${owner}/${repo}:`, err);
  }

  // 5. Fetch Repository File Tree (GET /repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1)
  let fileTree: string[] = [];
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
      {
        headers,
        redirect: "follow",
        next: { revalidate: 0 },
      }
    );

    if (treeRes.ok) {
      const treeJson = await treeRes.json();
      const rawTreeItems: Array<{ path?: string; type?: string }> =
        Array.isArray(treeJson.tree) ? treeJson.tree : [];

      // Extract file paths (blobs only, ignoring directory trees)
      const rawFilePaths = rawTreeItems
        .filter((item) => item.type === "blob" && typeof item.path === "string")
        .map((item) => item.path as string);

      fileTree = filterAndTruncateTree(rawFilePaths, 150);
    } else {
      console.warn(
        `Failed to fetch git tree for ${owner}/${repo} on branch ${defaultBranch}: ${treeRes.status}`
      );
    }
  } catch (err) {
    console.warn(`Error fetching git tree for ${owner}/${repo}:`, err);
  }

  return {
    metadata,
    readme,
    release,
    languages,
    primaryLanguage,
    fileTree,
  };
}

/**
 * Lightweight fetch of only the latest release for a repository (GET /repos/{owner}/{repo}/releases/latest).
 * Returns null if no release exists (e.g. 404).
 */
export async function fetchLatestReleaseOnly(
  owner: string,
  repo: string
): Promise<LatestRelease | null> {
  const headers = getGitHubHeaders();

  const releaseRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
    {
      headers,
      redirect: "follow",
      next: { revalidate: 0 },
    }
  );

  if (releaseRes.status === 404) {
    return null;
  }

  if (!releaseRes.ok) {
    if (releaseRes.status === 403 || releaseRes.status === 429) {
      const rateLimitRemaining = releaseRes.headers.get("x-ratelimit-remaining");
      if (rateLimitRemaining === "0") {
        throw new Error("GitHub API rate limit exceeded.");
      }
    }
    throw new Error(
      `GitHub API error (${releaseRes.status}): ${releaseRes.statusText}`
    );
  }

  const releaseJson = await releaseRes.json();
  const version = releaseJson.tag_name || releaseJson.name || "Latest";
  const date = (releaseJson.published_at || new Date().toISOString()).slice(0, 10);
  const downloadUrl =
    (Array.isArray(releaseJson.assets) &&
      releaseJson.assets[0]?.browser_download_url) ||
    releaseJson.html_url ||
    null;

  return {
    version,
    date,
    downloadUrl,
  };
}

