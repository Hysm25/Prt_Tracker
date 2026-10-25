import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { FilterDropdown, FilterDropdownOption } from "../components/FilterDropdown";

describe("FilterDropdown component", () => {
  const options: FilterDropdownOption[] = [
    { value: "Windows", label: "Windows", count: 5 },
    { value: "Linux", label: "Linux", count: 3 },
    { value: "macOS", label: "macOS", count: 2 },
  ];

  it("renders with button label when no options are selected", () => {
    const html = renderToString(
      React.createElement(FilterDropdown, {
        label: "Port platforms",
        options,
        selectedValues: [],
        onChange: () => {},
      })
    );

    expect(html).toContain("Port platforms");
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("data-testid=\"badge-Port platforms\"");
  });

  it("renders count badge when options are selected", () => {
    const html = renderToString(
      React.createElement(FilterDropdown, {
        label: "Port platforms",
        options,
        selectedValues: ["Windows", "Linux"],
        onChange: () => {},
        color: "teal",
      })
    );

    expect(html).toContain("Port platforms");
    expect(html).toContain("(2)");
    expect(html).toContain("data-testid=\"badge-Port platforms\"");
  });

  it("supports different accent color themes", () => {
    const purpleHtml = renderToString(
      React.createElement(FilterDropdown, {
        label: "Original consoles",
        options,
        selectedValues: ["N64"],
        onChange: () => {},
        color: "purple",
      })
    );
    expect(purpleHtml).toContain("Original consoles");
    expect(purpleHtml).toContain("(1)");

    const amberHtml = renderToString(
      React.createElement(FilterDropdown, {
        label: "Approach",
        options,
        selectedValues: ["decompilation"],
        onChange: () => {},
        color: "amber",
      })
    );
    expect(amberHtml).toContain("Approach");
    expect(amberHtml).toContain("(1)");
  });
});
