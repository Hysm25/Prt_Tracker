import { SavedRepoItem } from "./types";

export interface FilterCriteria {
  platforms?: string[];
  consoles?: string[];
  approaches?: string[];
}

/**
 * Filters saved repositories based on Port platforms, Original consoles, and Approach.
 *
 * Rules:
 * - Within a single filter group: OR logic (any selected value matches).
 * - Between different filter groups: AND logic (repo must match all groups that have active selections).
 * - An empty filter group (no selections) does not restrict results.
 * - Repositories with missing/empty fields in an active group are hidden only while that group has active selections.
 */
export function filterSavedRepos(
  repos: SavedRepoItem[],
  criteria: FilterCriteria
): SavedRepoItem[] {
  const selectedPlatforms = criteria.platforms || [];
  const selectedConsoles = criteria.consoles || [];
  const selectedApproaches = criteria.approaches || [];

  return repos.filter((item) => {
    const result = item.result || {};
    const itemPlatforms = Array.isArray(result.platforms)
      ? result.platforms
      : [];
    const itemConsoles = Array.isArray(result.consoles)
      ? result.consoles
      : [];
    const itemApproach = (result.approach || "unknown").toLowerCase();

    // 1. Port platforms group (OR logic within group)
    if (selectedPlatforms.length > 0) {
      if (itemPlatforms.length === 0) {
        return false;
      }
      const matchesPlatform = selectedPlatforms.some((sp) =>
        itemPlatforms.includes(sp)
      );
      if (!matchesPlatform) {
        return false;
      }
    }

    // 2. Original consoles group (OR logic within group)
    if (selectedConsoles.length > 0) {
      if (itemConsoles.length === 0) {
        return false;
      }
      const matchesConsole = selectedConsoles.some((sc) =>
        itemConsoles.includes(sc)
      );
      if (!matchesConsole) {
        return false;
      }
    }

    // 3. Approach group (OR logic within group)
    if (selectedApproaches.length > 0) {
      // Missing approach defaults to "unknown", so it matches if "unknown" is selected
      const matchesApproach = selectedApproaches.some(
        (sa) => sa.toLowerCase() === itemApproach
      );
      if (!matchesApproach) {
        return false;
      }
    }

    return true;
  });
}
