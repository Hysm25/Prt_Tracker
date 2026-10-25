"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface FilterDropdownOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export type DropdownColor = "teal" | "purple" | "amber" | "indigo";

export interface FilterDropdownProps {
  label: string;
  options: FilterDropdownOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  onClear?: () => void;
  color?: DropdownColor;
}

export function FilterDropdown({
  label,
  options,
  selectedValues,
  onChange,
  onClear,
  color = "indigo",
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedCount = selectedValues.length;

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleOption = useCallback(
    (value: string) => {
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter((v) => v !== value));
      } else {
        onChange([...selectedValues, value]);
      }
    },
    [selectedValues, onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onClear) {
        onClear();
      } else {
        onChange([]);
      }
    },
    [onClear, onChange]
  );

  // Styling based on color prop
  let accentBorder = "border-zinc-800 hover:border-zinc-700";
  let activeBadgeClass = "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
  let checkboxAccent = "text-indigo-600 focus:ring-indigo-500";

  if (color === "teal") {
    accentBorder = selectedCount > 0 ? "border-teal-500/50 bg-zinc-900" : "border-zinc-800 hover:border-zinc-700";
    activeBadgeClass = "bg-teal-500/20 text-teal-300 border-teal-500/30";
    checkboxAccent = "text-teal-600 focus:ring-teal-500";
  } else if (color === "purple") {
    accentBorder = selectedCount > 0 ? "border-purple-500/50 bg-zinc-900" : "border-zinc-800 hover:border-zinc-700";
    activeBadgeClass = "bg-purple-500/20 text-purple-300 border-purple-500/30";
    checkboxAccent = "text-purple-600 focus:ring-purple-500";
  } else if (color === "amber") {
    accentBorder = selectedCount > 0 ? "border-amber-500/50 bg-zinc-900" : "border-zinc-800 hover:border-zinc-700";
    activeBadgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/30";
    checkboxAccent = "text-amber-600 focus:ring-amber-500";
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-zinc-900 border transition cursor-pointer select-none shadow-sm ${accentBorder} text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40`}
      >
        <span>{label}</span>

        {selectedCount > 0 && (
          <span
            className={`inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-xs font-semibold border ${activeBadgeClass}`}
            data-testid={`badge-${label}`}
          >
            {`(${selectedCount})`}
          </span>
        )}

        {/* Chevron Icon */}
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-zinc-200" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute left-0 top-full mt-2 w-64 max-h-72 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header row with option count and clear button */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-zinc-800/80 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">
              {label} ({options.length})
            </span>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Options list */}
          {options.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-zinc-500">
              No options available
            </div>
          ) : (
            <div className="space-y-0.5">
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm text-zinc-200 hover:bg-zinc-800/80 cursor-pointer select-none transition"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOption(option.value)}
                      className={`w-4 h-4 rounded border-zinc-700 bg-zinc-800 focus:ring-offset-zinc-900 cursor-pointer ${checkboxAccent}`}
                    />
                    {option.icon && (
                      <span className="shrink-0 flex items-center">
                        {option.icon}
                      </span>
                    )}
                    <span className="flex-1 truncate">{option.label}</span>
                    {typeof option.count === "number" && (
                      <span className="text-xs text-zinc-500 shrink-0">
                        ({option.count})
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
