"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ResultCard } from "@/components/ResultCard";
import { SavedRepoCard } from "@/components/SavedRepoCard";
import { ConsoleChip } from "@/components/ConsoleChip";
import {
  AnalyzeResponse,
  PortAnalysisResult,
  GitHubRepoMetadata,
  SavedRepoItem,
} from "@/lib/types";
import { parseGitHubUrl } from "@/lib/github";

const STORAGE_KEY = "prt-tracker-repos";

/**
 * Safely loads saved repositories from localStorage
 */
function loadSavedRepos(): SavedRepoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedRepoItem =>
        Boolean(item && typeof item === "object" && item.id && item.result)
    );
  } catch (err) {
    console.warn("Error reading prt-tracker-repos from localStorage:", err);
    return [];
  }
}

/**
 * Safely writes saved repositories to localStorage
 */
function persistSavedRepos(items: SavedRepoItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("Error writing prt-tracker-repos to localStorage:", err);
  }
}

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortAnalysisResult | null>(null);
  const [repo, setRepo] = useState<GitHubRepoMetadata | null>(null);
  const [cached, setCached] = useState<boolean>(false);
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);

  // Persistent tracked repos from localStorage
  const [savedRepos, setSavedRepos] = useState<SavedRepoItem[]>([]);
  const [selectedConsoles, setSelectedConsoles] = useState<string[]>([]);

  const resultCardRef = useRef<HTMLDivElement>(null);

  // Hydrate saved repos on client mount
  useEffect(() => {
    const initial = loadSavedRepos();
    setSavedRepos(initial);
  }, []);

  // Compute available native platforms from currently saved repositories with counts
  const availableConsoles = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of savedRepos) {
      const consoles = item.result.consoles;
      if (Array.isArray(consoles)) {
        for (const c of consoles) {
          if (c && typeof c === "string") {
            map.set(c, (map.get(c) || 0) + 1);
          }
        }
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [savedRepos]);

  // Filtered saved repos based on selected native platform filter chips
  const filteredSavedRepos = useMemo(() => {
    if (selectedConsoles.length === 0) {
      return savedRepos;
    }
    return savedRepos.filter((item) => {
      const itemConsoles = item.result.consoles;
      // Repos with an empty consoles array should be hidden when any filter is active
      if (!Array.isArray(itemConsoles) || itemConsoles.length === 0) {
        return false;
      }
      // OR logic: show repo if its native platforms include at least one selected value
      return selectedConsoles.some((selected) =>
        itemConsoles.includes(selected)
      );
    });
  }, [savedRepos, selectedConsoles]);

  // Client-side quick validation for github.com URLs
  const validateUrl = (input: string): boolean => {
    if (!input || !input.trim()) {
      setError("Please enter a GitHub repository URL.");
      return false;
    }
    const trimmed = input.trim();
    const parsed = parseGitHubUrl(trimmed);
    if (!parsed) {
      setError(
        "Invalid URL. Only github.com repository URLs are accepted (e.g. https://github.com/TwilitRealm/dusk)."
      );
      return false;
    }
    return true;
  };

  const handleAnalyze = async (targetUrl?: string) => {
    const inputUrl = (targetUrl || url).trim();

    if (!validateUrl(inputUrl)) {
      return;
    }

    const parsed = parseGitHubUrl(inputUrl);
    const repoId = parsed
      ? `${parsed.owner.toLowerCase()}/${parsed.repo.toLowerCase()}`
      : inputUrl.toLowerCase();

    setLoading(true);
    setError(null);
    setResult(null);
    setRepo(null);
    setCached(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: inputUrl }),
      });

      const data: AnalyzeResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze repository.");
      }

      if (data.data) {
        setResult(data.data);
        setRepo(data.repo || null);
        setCached(Boolean(data.cached));
        setActiveSavedId(repoId);

        // Save repository persistently in localStorage (avoiding duplicates)
        const newItem: SavedRepoItem = {
          id: repoId,
          owner: parsed ? parsed.owner : "owner",
          repo: parsed ? parsed.repo : "repo",
          url: inputUrl,
          analyzedAt: Date.now(),
          result: data.data,
          repoMetadata: data.repo,
        };

        setSavedRepos((prev) => {
          const remaining = prev.filter(
            (item) => item.id.toLowerCase() !== repoId.toLowerCase()
          );
          const updated = [newItem, ...remaining];
          persistSavedRepos(updated);
          return updated;
        });

        // Scroll smoothly to results card
        setTimeout(() => {
          resultCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        throw new Error("No analysis data returned from server.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while analyzing the repository.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalyze();
  };

  // Clicking a saved repo displays its stored result instantly
  const handleSelectSaved = (saved: SavedRepoItem) => {
    setUrl(saved.url);
    setResult(saved.result);
    setRepo(saved.repoMetadata || null);
    setCached(false);
    setError(null);
    setActiveSavedId(saved.id);

    setTimeout(() => {
      resultCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Re-run analysis for a saved repository
  const handleReanalyzeSaved = (savedUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUrl(savedUrl);
    handleAnalyze(savedUrl);
  };

  // Remove a saved repository
  const handleRemoveSaved = (idToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedRepos((prev) => {
      const updated = prev.filter(
        (item) => item.id.toLowerCase() !== idToRemove.toLowerCase()
      );
      persistSavedRepos(updated);
      return updated;
    });

    if (activeSavedId === idToRemove) {
      setActiveSavedId(null);
    }
  };

  // Toggle native platform filter chip
  const handleToggleConsoleFilter = (consoleName: string) => {
    setSelectedConsoles((prev) =>
      prev.includes(consoleName)
        ? prev.filter((c) => c !== consoleName)
        : [...prev, consoleName]
    );
  };

  // Clear all selected native platform filters
  const handleClearFilters = () => {
    setSelectedConsoles([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-teal-500/10 blur-3xl opacity-70" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between max-w-5xl w-full mx-auto px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <div>
          {/* Header */}
          <header className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Gemini 3.5 Flash Lite Repo Intelligence
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Game Port Analyzer
            </h1>

            <p className="max-w-xl mx-auto text-base sm:text-lg text-zinc-400">
              Analyze unofficial video game ports, decompilations, and engine recreations.
              Identify original consoles, target platforms, and latest releases.
            </p>
          </header>

          {/* Form Section */}
          <section className="mt-8 sm:mt-10 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  {/* GitHub Icon */}
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://github.com/owner/repository"
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm transition outline-none disabled:opacity-60 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-950/40 shrink-0"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>Analyze Port</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Loading Indicator */}
          {loading && (
            <div className="mt-12 max-w-2xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-4">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Analyzing Game Port Repository
              </h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                Fetching repository metadata, parsing raw README documentation, and prompting Gemini to extract original console and port details...
              </p>
              <div className="w-48 h-1.5 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                <div className="w-full h-full bg-indigo-500 origin-left animate-pulse" />
              </div>
            </div>
          )}

          {/* Error Message Box */}
          {error && !loading && (
            <div className="mt-8 max-w-2xl mx-auto rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1 text-sm">
                <p className="font-semibold text-red-300">Analysis Error</p>
                <p className="mt-1 text-red-200/90">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-200 transition"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Result Card */}
          {result && !loading && (
            <div ref={resultCardRef} className="mt-8 sm:mt-12">
              <ResultCard result={result} repo={repo || undefined} cached={cached} />
            </div>
          )}

          {/* Saved Tracked Repositories Section */}
          <section className="mt-14 sm:mt-18 pt-8 border-t border-zinc-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Tracked Repositories</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
                    {savedRepos.length}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Repositories saved locally. Click any project to view its analysis or re-analyze.
                </p>
              </div>
            </div>

            {/* Native Platform Filter Section */}
            {savedRepos.length > 0 && availableConsoles.length > 0 && (
              <div className="mb-6 p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Filter by Native Platform:
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      (Original consoles)
                    </span>
                  </div>

                  {selectedConsoles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition"
                      title="Clear selected platform filters"
                    >
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Clear ({selectedConsoles.length})</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableConsoles.map(({ name, count }) => (
                    <ConsoleChip
                      key={name}
                      name={name}
                      count={count}
                      selected={selectedConsoles.includes(name)}
                      onClick={() => handleToggleConsoleFilter(name)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Grid of Saved Repos */}
            {filteredSavedRepos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSavedRepos.map((item) => (
                  <SavedRepoCard
                    key={item.id}
                    item={item}
                    isSelected={activeSavedId === item.id}
                    onSelect={handleSelectSaved}
                    onRemove={handleRemoveSaved}
                    onReanalyze={handleReanalyzeSaved}
                  />
                ))}
              </div>
            ) : savedRepos.length > 0 ? (
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-8 text-center text-zinc-400">
                <p className="text-sm">
                  No saved repositories match the selected native platform filter.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                >
                  Clear platform filters
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center text-zinc-500">
                <svg
                  className="w-8 h-8 mx-auto text-zinc-600 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p className="text-sm font-medium text-zinc-400">
                  No repositories tracked yet
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Paste a game port repository URL above to analyze and automatically save it to your tracked list.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Minimal Footer */}
        <footer className="mt-16 pt-8 border-t border-zinc-800/80 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Game Port Tracker & Analyzer</p>
          <div className="flex items-center gap-4">
            <span>Powered by Gemini 3.5 Flash Lite</span>
            <span>•</span>
            <span>GitHub REST API</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
