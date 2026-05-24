import type {
  AssignmentRiskPositionEntry,
  AssignmentRiskSummary,
} from "@/app/types/schwab";

export function filterAssignmentRiskSummary(
  summary: AssignmentRiskSummary,
  symbol?: string | null,
): AssignmentRiskSummary {
  if (!symbol) return summary;

  const normalized = symbol.trim().toUpperCase();
  const positions = summary.positions.filter(
    (entry) => entry.underlyingSymbol?.toUpperCase() === normalized,
  );

  return {
    ...summary,
    scopeSymbol: normalized,
    positions,
  };
}

export function hasAssignmentRiskEntries(summary: AssignmentRiskSummary): boolean {
  return summary.positions.length > 0;
}

export function assignmentRiskSortPriority(entry: AssignmentRiskPositionEntry): number {
  const order: Record<string, number> = {
    critical: 0,
    high: 1,
    moderate: 2,
    watch: 3,
    low: 4,
  };
  return order[entry.riskLevel] ?? 5;
}
