import React from "react";

export type ChipColor = "purple" | "teal";

interface ConsoleChipProps {
  name: string;
  selected?: boolean;
  onClick?: () => void;
  count?: number;
  className?: string;
  interactive?: boolean;
  color?: ChipColor;
}

/**
 * Reusable Console / Platform chip component.
 * Supports different accent color themes to easily distinguish filter groups:
 * - "purple": Original consoles
 * - "teal": Port target platforms
 */
export function ConsoleChip({
  name,
  selected = false,
  onClick,
  count,
  className = "",
  interactive = true,
  color = "purple",
}: ConsoleChipProps) {
  const isTeal = color === "teal";

  if (!interactive) {
    const staticClasses = isTeal
      ? "bg-teal-500/10 text-teal-300 border-teal-500/25"
      : "bg-purple-500/10 text-purple-300 border-purple-500/25";

    const iconColor = isTeal ? "text-teal-400" : "text-purple-400";

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${staticClasses} ${className}`}
      >
        <svg
          className={`w-3 h-3 ${iconColor} shrink-0`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isTeal ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
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

  const selectedClasses = isTeal
    ? "bg-teal-600 text-white shadow-md shadow-teal-900/40 border border-teal-400"
    : "bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400";

  const dotClasses = selected
    ? "bg-white"
    : isTeal
    ? "bg-teal-400"
    : "bg-purple-400";

  const badgeClasses = selected
    ? isTeal
      ? "bg-teal-700/80 text-white"
      : "bg-purple-700/80 text-white"
    : "bg-zinc-800 text-zinc-400";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
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
