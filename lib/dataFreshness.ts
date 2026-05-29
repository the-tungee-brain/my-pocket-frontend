export type PositionsDataFreshness = {
  positionsSyncedAt: string;
  positionsSource: "schwab";
  briefStatus: "ready" | "cached" | "pending";
};

export function parsePositionsSyncedAt(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/** Shown only while the morning brief is still warming after a fast positions load. */
export function briefFreshnessLabel(
  freshness: PositionsDataFreshness | null | undefined,
  briefLoading: boolean,
): string | null {
  if (briefLoading || freshness?.briefStatus === "pending") {
    return "Morning brief · updating…";
  }
  return null;
}
