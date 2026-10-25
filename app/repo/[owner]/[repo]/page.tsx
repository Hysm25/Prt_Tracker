"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SavedRepoItem, AnalyzeResponse } from "@/lib/types";
import { ConsoleChip } from "@/components/ConsoleChip";
import { PlatformIcon } from "@/lib/platformIcons";

const STORAGE_KEY = "prt-tracker-repos";

const APPROACH_TOOLTIPS: Record<string, string> = {
  recompilation:
    "Static or binary recompilation directly from original game executable or bytecode",
  decompilation:
    "Reverse-engineered source code recreation matching original binaries",
  reimplementation:
    "Clean-room or engine rewrite recreating game assets and logic",
  unknown: "Porting approach or methodology not explicitly specified",
};

function RepoDetailContent() {
  const params = useParams<{ owner?: string; repo?: string }>();
  const router = useRouter();

  const rawOwner = params?.owner;
  const rawRepo = params?.repo;
  const owner = typeof rawOwner === "string" ? decodeURIComponent(rawOwner) : "";
  const repo = typeof rawRepo === "string" ? decodeURIComponent(rawRepo) : "";

  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<SavedRepoItem | null>(null);

  const fetchAnalysis = useCallback(
    async (ownerName: string, repoName: string) => {
      const targetUrl = `https://github.com/${ownerName}/${repoName}`;
      setError(null);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });

        const data: AnalyzeResponse = await res.json();

        if (!res.ok || !data.success || !data.data) {
          throw new Error(data.error || "Failed to analyze repository.");
        }

        const normalizedId = `${ownerName.toLowerCase()}/${repoName.toLowerCase()}`;
        const newItem: SavedRepoItem = {
          id: normalizedId,
          owner: ownerName,
          repo: repoName,
          url: targetUrl,
          analyzedAt: Date.now(),
          lastCheckedAt: new Date().toISOString(),
          result: data.data,
          repoMetadata: data.repo,
        };

        // Persist to localStorage
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const list: SavedRepoItem[] = raw ? JSON.parse(raw) : [];
          const remaining = Array.isArray(list)
            ? list.filter((p) => p.id?.toLowerCase() !== normalizedId)
            : [];
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([newItem, ...remaining])
          );
        } catch (storageErr) {
          console.warn("Error updating localStorage:", storageErr);
        }

        setItem(newItem);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while analyzing the repository.";
        setError(msg);
      } finally {
        setLoading(false);
        setReanalyzing(false);
      }
    },
    []
  );

  // Initial load: look in localStorage, or fetch via /api/analyze if not found
  useEffect(() => {
    if (!owner || !repo) {
      setError("Invalid repository path.");
      setLoading(false);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list: SavedRepoItem[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          const normalizedId = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
          const existing = list.find(
            (p) =>
              p.id?.toLowerCase() === normalizedId ||
              (p.owner?.toLowerCase() === owner.toLowerCase() &&
                p.repo?.toLowerCase() === repo.toLowerCase())
          );

          if (existing && existing.result) {
            setItem(existing);
            setLoading(false);
            return;
          }
        }
      }
    } catch (readErr) {
      console.warn("Error reading localStorage:", readErr);
    }

    // No saved entry found on this device; fetch from API
    fetchAnalysis(owner, repo);
  }, [owner, repo, fetchAnalysis]);

  const handleReanalyze = () => {
    if (!owner || !repo) return;
    setReanalyzing(true);
    fetchAnalysis(owner, repo);
  };

  const githubUrl = item?.repoMetadata?.htmlUrl || `https://github.com/${owner}/${repo}`;
  const result = item?.result;
  const description = item?.repoMetadata?.description;
  const approach = result?.approach || "unknown";
  const approachTooltip =
    result?.approachEvidence?.trim() ||
    APPROACH_TOOLTIPS[approach.toLowerCase()] ||
    APPROACH_TOOLTIPS.unknown;
  const confidence = result?.confidence || null;
  const consoles = Array.isArray(result?.consoles) ? result.consoles : [];
  const platforms = Array.isArray(result?.platforms) ? result.platforms : [];
  const latestRelease = result?.latestRelease || null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-teal-500/10 blur-3xl opacity-70" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        {/* Navigation Bar: Back link & Re-analyze button */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition group"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Home</span>
          </Link>

          {!loading && !error && (
            <button
              type="button"
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <svg
                className={`w-4 h-4 ${reanalyzing ? "animate-spin text-indigo-400" : "text-zinc-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{reanalyzing ? "Re-analyzing..." : "Re-analyze"}</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-12 text-center space-y-4 backdrop-blur-sm">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
              <svg
                className="w-8 h-8 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">
              Loading Repository Details
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Analyzing {owner}/{repo}... Fetching repository structure, metadata, and latest releases.
            </p>
          </div>
        )}

        {/* Not-Found / Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-300">
              Repository Not Found or Analysis Failed
            </h2>
            <p className="text-sm text-red-200/90 max-w-lg mx-auto">{error}</p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
              >
                Back to Home
              </Link>
              <button
                type="button"
                onClick={handleReanalyze}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Content View: Show Everything in One Place */}
        {!loading && !error && result && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Unofficial Game Port
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      {owner}/{repo}
                    </span>
                  </div>

                  {/* Project Name */}
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
                    {result.projectName || repo}
                  </h1>

                  {/* Original Game */}
                  <div className="mt-3 flex items-center gap-2 text-zinc-300">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
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
                          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                        />
                      </svg>
                    </div>
                    <span className="text-base sm:text-lg font-medium">
                      Original Game:{" "}
                      <span className="text-white font-semibold">
                        {result.originalGame || "Unknown Game"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* GitHub Link Button */}
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700/90 border border-zinc-700 transition shadow-sm shrink-0 self-start"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>View on GitHub</span>
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
              </div>

              {/* Description */}
              {description && (
                <p className="mt-4 text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/80 pt-4">
                  {description}
                </p>
              )}

              {/* Language, Approach & Confidence Bar */}
              <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-wrap items-center gap-4">
                {/* Language */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Language:
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-zinc-800 text-zinc-200 border border-zinc-700">
                    {result.language || "unknown"}
                  </span>
                </div>

                <span className="text-zinc-700 hidden sm:inline">•</span>

                {/* Approach & Confidence */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Approach:
                  </span>
                  <span
                    title={approachTooltip}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 cursor-help"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="capitalize">{approach}</span>
                  </span>

                  {confidence && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${
                        confidence === "high"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                          : confidence === "medium"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                      title={`Confidence level: ${confidence}`}
                    >
                      {confidence} confidence
                    </span>
                  )}
                </div>
              </div>

              {/* Evidence Text */}
              {result.approachEvidence && (
                <div className="mt-4 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
                  <span className="text-amber-400 text-base leading-none select-none">
                    “
                  </span>
                  <p className="italic text-zinc-300 flex-1">
                    {result.approachEvidence}
                  </p>
                </div>
              )}
            </div>

            {/* Hardware & Compatibility Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Consoles Card */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                    Original Consoles
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    (Native hardware)
                  </span>
                </div>
                {consoles.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {consoles.map((c) => (
                      <ConsoleChip
                        key={c}
                        name={c}
                        interactive={false}
                        color="purple"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic pt-1">
                    No console information detected
                  </p>
                )}
              </div>

              {/* Port Platforms Card (with platform icons) */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                    Port Platforms
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    (Target platforms)
                  </span>
                </div>
                {platforms.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {platforms.map((platform) => (
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
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic pt-1">
                    No target platforms detected
                  </p>
                )}
              </div>
            </div>

            {/* Latest Release Card with Download Button */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 backdrop-blur-sm space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Latest Release
              </span>

              {latestRelease ? (
                <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        {latestRelease.version}
                      </span>
                      <span className="text-xs text-zinc-400">
                        • Published {latestRelease.date}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Binary release package and installation assets
                    </p>
                  </div>

                  {latestRelease.downloadUrl && (
                    <a
                      href={latestRelease.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-lg shadow-emerald-950/40 shrink-0"
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
                <div className="rounded-xl bg-zinc-950/40 border border-zinc-800 p-4 text-xs text-zinc-400 flex items-center gap-3">
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
                      No binary releases published
                    </p>
                    <p className="text-zinc-500">
                      This port may require compilation from source code or extracting assets from an original game disk/ROM.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RepoDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center p-8">
          <div className="animate-pulse text-sm">Loading repository details...</div>
        </div>
      }
    >
      <RepoDetailContent />
    </React.Suspense>
  );
}
