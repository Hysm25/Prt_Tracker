"use client";

import React, { useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { AnalyzeResponse, PortAnalysisResult, GitHubRepoMetadata } from "@/lib/types";

// Quick-select curated repository examples
const EXAMPLE_REPOS = [
  {
    name: "TwilitRealm/dusk",
    url: "https://github.com/TwilitRealm/dusk",
    label: "Twilight Princess (Dusklight)",
  },
  {
    name: "HarbourMasters/Shipwright",
    url: "https://github.com/HarbourMasters/Shipwright",
    label: "Ocarina of Time (Ship of Harkinian)",
  },
  {
    name: "open-goal/jak-project",
    url: "https://github.com/open-goal/jak-project",
    label: "Jak and Daxter (OpenGOAL)",
  },
  {
    name: "sm64pc/sm64ex",
    url: "https://github.com/sm64pc/sm64ex",
    label: "Super Mario 64 (sm64ex)",
  },
];

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortAnalysisResult | null>(null);
  const [repo, setRepo] = useState<GitHubRepoMetadata | null>(null);
  const [cached, setCached] = useState<boolean>(false);

  // Client-side quick validation for github.com URLs
  const validateUrl = (input: string): boolean => {
    if (!input || !input.trim()) {
      setError("Please enter a GitHub repository URL.");
      return false;
    }
    const trimmed = input.trim();
    const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/i;
    if (!githubRegex.test(trimmed)) {
      setError("Invalid URL. Only github.com repository URLs are accepted (e.g. https://github.com/TwilitRealm/dusk).");
      return false;
    }
    return true;
  };

  const handleAnalyze = async (targetUrl?: string) => {
    const inputUrl = (targetUrl || url).trim();

    if (!validateUrl(inputUrl)) {
      return;
    }

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

  const handleSelectExample = (exampleUrl: string) => {
    setUrl(exampleUrl);
    handleAnalyze(exampleUrl);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-teal-500/10 blur-3xl opacity-70" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between max-w-4xl w-full mx-auto px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <div>
          {/* Header */}
          <header className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Gemini 2.0 Flash Repo Intelligence
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Game Port Analyzer
            </h1>

            <p className="max-w-xl mx-auto text-base sm:text-lg text-zinc-400">
              Paste an unofficial game port or decompilation GitHub repository to identify the
              original game, target platforms, and latest release packages.
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
                  placeholder="https://github.com/TwilitRealm/dusk"
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

            {/* Quick Example Suggestions */}
            <div className="mt-4">
              <span className="text-xs text-zinc-500 mr-2">Try an example:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {EXAMPLE_REPOS.map((example) => (
                  <button
                    key={example.name}
                    type="button"
                    onClick={() => handleSelectExample(example.url)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 bg-zinc-900/90 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/80 transition disabled:opacity-50"
                  >
                    <span>{example.name}</span>
                  </button>
                ))}
              </div>
            </div>
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
                Fetching repository metadata, parsing raw README documentation, and prompting Gemini 2.0 Flash to extract port details...
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
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Result Card */}
          {result && !loading && (
            <div className="mt-8 sm:mt-12">
              <ResultCard result={result} repo={repo || undefined} cached={cached} />
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <footer className="mt-16 pt-8 border-t border-zinc-800/80 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Unofficial Game Port Repository Analyzer</p>
          <div className="flex items-center gap-4">
            <span>Powered by Gemini 2.0 Flash</span>
            <span>•</span>
            <span>GitHub REST API</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
