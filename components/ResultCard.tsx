import React from "react";
import { PortAnalysisResult, GitHubRepoMetadata } from "@/lib/types";
import { ConsoleChip } from "./ConsoleChip";
import { PlatformIcon } from "@/lib/platformIcons";

interface ResultCardProps {
  result: PortAnalysisResult;
  repo?: GitHubRepoMetadata;
  cached?: boolean;
}

const APPROACH_TOOLTIPS: Record<string, string> = {
  recompilation:
    "Static or binary recompilation directly from original game executable or bytecode",
  decompilation:
    "Reverse-engineered source code recreation matching original binaries",
  reimplementation:
    "Clean-room or engine rewrite recreating game assets and logic",
  unknown: "Porting approach or methodology not explicitly specified",
};

/**
 * Returns tailored colors for popular gaming platforms
 */
function getPlatformBadgeClasses(platform: string): string {
  const normalized = platform.toLowerCase();
  if (normalized.includes("win")) {
    return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }
  if (normalized.includes("linux")) {
    return "bg-amber-500/10 text-amber-300 border-amber-500/30";
  }
  if (
    normalized.includes("mac") ||
    normalized.includes("apple") ||
    normalized.includes("darwin")
  ) {
    return "bg-purple-500/10 text-purple-300 border-purple-500/30";
  }
  if (normalized.includes("steam deck") || normalized.includes("deck")) {
    return "bg-teal-500/10 text-teal-300 border-teal-500/30";
  }
  if (normalized.includes("android")) {
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  }
  if (
    normalized.includes("ios") ||
    normalized.includes("iphone") ||
    normalized.includes("ipad")
  ) {
    return "bg-pink-500/10 text-pink-300 border-pink-500/30";
  }
  if (normalized.includes("switch") || normalized.includes("nintendo")) {
    return "bg-red-500/10 text-red-400 border-red-500/30";
  }
  return "bg-zinc-800 text-zinc-300 border-zinc-700";
}

export function ResultCard({ result, repo, cached }: ResultCardProps) {
  // Defensive fallbacks for missing fields
  const projectName = result.projectName || repo?.name || "Unknown Project";
  const originalGame = result.originalGame || "Unknown Game";
  const language = result.language || "unknown";
  const approach = result.approach || "unknown";
  const consoles = Array.isArray(result.consoles) ? result.consoles : [];
  const platforms = Array.isArray(result.platforms) ? result.platforms : [];
  const latestRelease = result.latestRelease || null;

  const approachTooltip =
    result.approachEvidence?.trim() ||
    APPROACH_TOOLTIPS[approach.toLowerCase()] ||
    APPROACH_TOOLTIPS.unknown;

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-xl p-6 sm:p-8 transition-all hover:border-zinc-700">
      {/* Header with Project Name & Cached Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Unofficial Port
            </span>
            {cached && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Cached
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2">
            {projectName}
          </h2>
        </div>

        {/* GitHub link button */}
        {repo && (
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700/90 hover:text-white rounded-lg border border-zinc-700 transition shadow-sm self-start sm:self-center"
            title="View source on GitHub"
          >
            {/* GitHub Octocat SVG */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
            <svg
              className="w-3.5 h-3.5 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {/* Language & Approach Badges */}
      <div className="py-4 border-b border-zinc-800/80 flex flex-wrap items-center gap-3">
        {/* Language small tag */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Language:
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            {language}
          </span>
        </div>

        <span className="text-zinc-600 hidden sm:inline">•</span>

        {/* Approach labeled badge with tooltip */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Approach:
          </span>
          <span
            title={approachTooltip}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 cursor-help"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="capitalize">{approach}</span>
            <svg
              className="w-3 h-3 text-amber-400/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* Original Game Section */}
      <div className="py-5 border-b border-zinc-800/80">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Original Game
        </span>
        <div className="mt-1 flex items-center gap-2">
          {/* Gamepad Icon */}
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
          <span className="text-lg sm:text-xl font-medium text-zinc-100">
            {originalGame}
          </span>
        </div>
      </div>

      {/* Original Consoles / Native Platform (Separate from target platforms) */}
      {consoles.length > 0 && (
        <div className="py-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Native Platform(s)
            </span>
            <span className="text-[11px] text-zinc-500">
              (Original console release)
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {consoles.map((consoleName) => (
              <ConsoleChip
                key={consoleName}
                name={consoleName}
                interactive={false}
                color="purple"
              />
            ))}
          </div>
        </div>
      )}

      {/* Target Platforms Icons */}
      <div className="py-5 border-b border-zinc-800/80">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Port Target Platforms
        </span>
        <div className="mt-3 flex flex-wrap gap-2">
          {platforms.length > 0 ? (
            platforms.map((platform) => (
              <span
                key={platform}
                title={platform}
                aria-label={platform}
                className="inline-flex items-center justify-center p-2.5 rounded-xl border border-zinc-800 bg-zinc-800/80 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
              >
                <PlatformIcon
                  platform={platform}
                  className="w-5 h-5"
                  showTooltip={true}
                />
              </span>
            ))
          ) : (
            <span className="text-xs text-zinc-500 italic">No platform info</span>
          )}
        </div>
      </div>

      {/* Latest Release Details */}
      <div className="pt-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Latest Release
        </span>

        {latestRelease ? (
          <div className="mt-3 rounded-xl bg-zinc-950/60 border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {latestRelease.version}
                </span>
                <span className="text-xs text-zinc-400">
                  • Published {latestRelease.date}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Binary packages or assets ready for download
              </p>
            </div>

            {latestRelease.downloadUrl && (
              <a
                href={latestRelease.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-lg shadow-emerald-900/30"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Download Release</span>
              </a>
            )}
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 p-4 text-sm text-zinc-400 flex items-center gap-3">
            <svg
              className="w-5 h-5 text-zinc-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium text-zinc-300">
                No binary releases found
              </p>
              <p className="text-xs text-zinc-500">
                This project may require building from source code or supplying
                original game ROM/assets manually.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Repo Stats Footer */}
      {repo && (
        <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5 text-amber-400 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              {repo.stars.toLocaleString()} stars
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              {repo.forks.toLocaleString()} forks
            </span>
          </div>

          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300 transition underline underline-offset-2"
          >
            {repo.fullName}
          </a>
        </div>
      )}
    </div>
  );
}
