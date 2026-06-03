import type { RankingItem, RankingsTopResponse } from "@/app/types/rankings";

function readNumber(
  record: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readInt(
  record: Record<string, unknown>,
  keys: string[],
): number | null {
  const value = readNumber(record, keys);
  return value == null ? null : Math.trunc(value);
}

export function normalizeRankingItem(raw: unknown): RankingItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const symbolRaw = row.symbol ?? row.Symbol ?? row.ticker;
  if (typeof symbolRaw !== "string" || !symbolRaw.trim()) return null;
  const symbol = symbolRaw.trim().toUpperCase();

  const rank =
    readInt(row, ["rank", "Rank"]) ??
    readInt(row, ["position", "Position"]) ??
    0;

  const finalScore = readNumber(row, ["final_score", "finalScore"]);
  if (finalScore == null) return null;

  const mlProbability = readNumber(row, [
    "ml_probability",
    "mlProbability",
    "probability_outperform_spy",
    "probabilityOutperformSpy",
  ]);

  const expectedExcessReturn = readNumber(row, [
    "expected_excess_return",
    "expectedExcessReturn",
    "excess_return_5d",
    "excessReturn5d",
  ]);

  return {
    symbol,
    rank,
    final_score: finalScore,
    ml_probability: mlProbability,
    expected_excess_return: expectedExcessReturn,
  };
}

export function normalizeRankingsTopResponse(data: unknown): RankingsTopResponse {
  const root =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  const rawItems = Array.isArray(root.items)
    ? root.items
    : Array.isArray(root.stocks)
      ? root.stocks
      : [];

  const items = rawItems
    .map(normalizeRankingItem)
    .filter((item): item is RankingItem => item != null)
    .sort((a, b) => a.rank - b.rank);

  return {
    api_version: String(root.api_version ?? root.apiVersion ?? "v1"),
    timestamp: String(root.timestamp ?? ""),
    run_id: String(root.run_id ?? root.runId ?? ""),
    as_of_date: String(root.as_of_date ?? root.asOfDate ?? ""),
    regime_id:
      typeof root.regime_id === "string"
        ? root.regime_id
        : typeof root.regimeId === "string"
          ? root.regimeId
          : null,
    items,
  };
}
