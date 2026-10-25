"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SavedRepoItem } from "@/lib/types";
import { ConsoleChip } from "./ConsoleChip";
import { PlatformIcon } from "@/lib/platformIcons";
import { formatUpdatedTime } from "@/lib/time";

interface SavedRepoCardProps {
  item: SavedRepoItem;
  isSelected?: boolean;
  onSelect?: (item: SavedRepoItem) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onReanalyze: (url: string, e: React.MouseEvent) => void;
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

export function SavedRepoCard({
  item,
  isSelected,
  onSelect,
  onRemove,
  onReanalyze,
}: SavedRepoCardProps) {
  const router = useRouter();
  const result = item.result || {};
  const repoMetadata = item.repoMetadata;
  const url = item.url;
  const githubUrl = repoMetadata?.htmlUrl || url;

  // Defensive handling for missing fields in stored entries
  const projectName = result.projectName || item.repo || "Unknown Project";
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

  const updatedLabel = formatUpdatedTime(
    item.lastCheckedAt || item.analyzedAt
  );

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(item);
    }
    router.push(
      `/repo/${encodeURIComponent(item.owner)}/${encodeURIComponent(item.repo)}`
    );
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-xl border p-5 transition-all duration-200 cursor-pointer bg-zinc-900/70 hover:bg-zinc-800/80 backdrop-blur-sm ${
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-zinc-850"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {/* Top row: Project Name, Updated Label & Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-white truncate group-hover:text-indigo-300 transition">
              {projectName}
            </h3>
          </div>
          <p className="text-xs text-zinc-400 truncate mt-0.5">
            {originalGame}
          </p>
        </div>

        {/* Action buttons */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Re-analyze button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onReanalyze(url, e);
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-750 transition"
            title="Re-analyze repository"
          >
            <svg
              className="w-3.5 h-3.5"
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
          </button>

          {/* GitHub External link */}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-750 transition"
            title="Open in GitHub"
          >
            <svg
              className="w-3.5 h-3.5"
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

          {/* Remove button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(item.id, e);
            }}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
            title="Remove from saved ports"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Language small tag, Approach labeled badge & Updated X hours ago label */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700"
            title={`Programming language: ${language}`}
          >
            {language}
          </span>

          <span
            title={approachTooltip}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25 cursor-help"
          >
            <span className="text-[10px] text-amber-400/80 uppercase font-semibold">
              Approach:
            </span>
            <span className="capitalize">{approach}</span>
          </span>
        </div>

        {/* Small "Updated X hours ago" label */}
        <span
          className="text-[11px] text-zinc-500 font-normal shrink-0"
          title={`Last checked: ${item.lastCheckedAt || "N/A"}`}
        >
          {updatedLabel}
        </span>
      </div>

      {/* Middle row: Original Console Tags */}
      {consoles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {consoles.map((c) => (
            <ConsoleChip key={c} name={c} interactive={false} color="purple" />
          ))}
        </div>
      )}

      {/* Bottom row: Version badge & Port Platform Icons */}
      <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-zinc-500">Version:</span>
          {latestRelease ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {latestRelease.version}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500 italic">No release</span>
          )}
        </div>

        {/* Platform Icons (replacing text badges) */}
        {platforms.length > 0 ? (
          <div className="flex items-center gap-1.5 text-zinc-400">
            {platforms.map((platform) => (
              <span
                key={platform}
                className="p-1 rounded bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 hover:text-white transition flex items-center justify-center"
                title={platform}
              >
                <PlatformIcon
                  platform={platform}
                  className="w-3.5 h-3.5"
                  showTooltip={true}
                />
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-zinc-500 italic">No platform info</span>
        )}
      </div>
    </div>
  );
}
