import React from "react";

interface ConsoleChipProps {
  name: string;
  selected?: boolean;
  onClick?: () => void;
  count?: number;
  className?: string;
  interactive?: boolean;
}

/**
 * Reusable Console / Native Platform chip component.
 * Used both as an interactive filter chip and as a static platform tag.
 */
export function ConsoleChip({
  name,
  selected = false,
  onClick,
  count,
  className = "",
  interactive = true,
}: ConsoleChipProps) {
  if (!interactive) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/25 ${className}`}
      >
        <svg
          className="w-3 h-3 text-purple-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <span>{name}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer select-none ${
        selected
          ? "bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400"
          : "bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
      } ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full transition-colors ${
          selected ? "bg-white" : "bg-purple-400"
        }`}
      />
      <span>{name}</span>
      {typeof count === "number" && (
        <span
          className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
            selected
              ? "bg-purple-700/80 text-white"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
