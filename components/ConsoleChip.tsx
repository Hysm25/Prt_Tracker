import React from "react";

export type ChipColor = "purple" | "teal" | "amber";

interface ConsoleChipProps {
  name: string;
  selected?: boolean;
  onClick?: () => void;
  count?: number;
  className?: string;
  interactive?: boolean;
  color?: ChipColor;
  title?: string;
}

/**
 * Reusable Chip component for filtering and tags.
 * Supports different accent color themes:
 * - "purple": Original consoles
 * - "teal": Port target platforms
 * - "amber": Approach methodology
 */
export function ConsoleChip({
  name,
  selected = false,
  onClick,
  count,
  className = "",
  interactive = true,
  color = "purple",
  title,
}: ConsoleChipProps) {
  if (!interactive) {
    let staticClasses = "bg-purple-500/10 text-purple-300 border-purple-500/25";
    let iconColor = "text-purple-400";

    if (color === "teal") {
      staticClasses = "bg-teal-500/10 text-teal-300 border-teal-500/25";
      iconColor = "text-teal-400";
    } else if (color === "amber") {
      staticClasses = "bg-amber-500/10 text-amber-300 border-amber-500/25";
      iconColor = "text-amber-400";
    }

    return (
      <span
        title={title}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${staticClasses} ${className}`}
      >
        <svg
          className={`w-3 h-3 ${iconColor} shrink-0`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {color === "teal" ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          ) : color === "amber" ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          )}
        </svg>
        <span>{name}</span>
      </span>
    );
  }

  let selectedClasses = "bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400";
  let dotClasses = selected ? "bg-white" : "bg-purple-400";
  let badgeClasses = selected ? "bg-purple-700/80 text-white" : "bg-zinc-800 text-zinc-400";

  if (color === "teal") {
    selectedClasses = "bg-teal-600 text-white shadow-md shadow-teal-900/40 border border-teal-400";
    dotClasses = selected ? "bg-white" : "bg-teal-400";
    badgeClasses = selected ? "bg-teal-700/80 text-white" : "bg-zinc-800 text-zinc-400";
  } else if (color === "amber") {
    selectedClasses = "bg-amber-600 text-white shadow-md shadow-amber-900/40 border border-amber-400";
    dotClasses = selected ? "bg-white" : "bg-amber-400";
    badgeClasses = selected ? "bg-amber-700/80 text-white" : "bg-zinc-800 text-zinc-400";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={title}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer select-none ${
        selected
          ? selectedClasses
          : "bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full transition-colors ${dotClasses}`} />
      <span>{name}</span>
      {typeof count === "number" && (
        <span
          className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${badgeClasses}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
