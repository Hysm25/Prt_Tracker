import React from "react";
import { SavedRepoItem } from "@/lib/types";
import { ConsoleChip } from "./ConsoleChip";

interface SavedRepoCardProps {
  item: SavedRepoItem;
  isSelected?: boolean;
  onSelect: (item: SavedRepoItem) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onReanalyze: (url: string, e: React.MouseEvent) => void;
}

export function SavedRepoCard({
  item,
  isSelected,
  onSelect,
  onRemove,
  onReanalyze,
}: SavedRepoCardProps) {
  const { result, repoMetadata, url } = item;
  const githubUrl = repoMetadata?.htmlUrl || url;

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative rounded-xl border p-5 transition-all duration-200 cursor-pointer bg-zinc-900/70 hover:bg-zinc-800/80 backdrop-blur-sm ${
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-zinc-850"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {/* Top row: Project Name & Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base text-white truncate group-hover:text-indigo-300 transition">
            {result.projectName}
          </h3>
          <p className="text-xs text-zinc-400 truncate mt-0.5">
            {result.originalGame}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Re-analyze button */}
          <button
            type="button"
            onClick={(e) => onReanalyze(url, e)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-750 transition"
            title="Re-analyze repository"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* GitHub External link */}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-750 transition"
            title="Open in GitHub"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* Remove button */}
          <button
            type="button"
            onClick={(e) => onRemove(item.id, e)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
            title="Remove from saved ports"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Middle row: Console Tags */}
      {result.consoles && result.consoles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {result.consoles.map((c) => (
            <ConsoleChip key={c} name={c} interactive={false} />
          ))}
        </div>
      )}

      {/* Bottom row: Version badge & Platforms summary */}
      <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-zinc-500">Version:</span>
          {result.latestRelease ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {result.latestRelease.version}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500 italic">No release</span>
          )}
        </div>

        <span className="text-[11px] text-zinc-500 truncate max-w-[150px]">
          {result.platforms.slice(0, 3).join(", ")}
          {result.platforms.length > 3 ? ` +${result.platforms.length - 3}` : ""}
        </span>
      </div>
    </div>
  );
}
