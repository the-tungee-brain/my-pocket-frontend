"use client";

import type { RankingItem } from "@/app/types/rankings";
import type { PatternIntelligence } from "@/app/types/intelligence";
import {
  formatExcessReturn,
  formatProbability,
  rankingsHaveMlMetrics,
  topUniverseLabel,
  trendDisplayFromIntelligence,
  trendDisplayFromRank,
} from "@/lib/topMovers";
import { cn } from "@/lib/utils";

type Props = {
  items: RankingItem[];
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
  companyNames?: Record<string, string>;
  universeSize?: number | null;
  intelligenceBySymbol?: Record<string, PatternIntelligence | null | undefined>;
};

function TrendChip({
  label,
  glyph,
  tone,
}: {
  label: string;
  glyph: string;
  tone: "positive" | "neutral" | "negative";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "positive" && "bg-success/15 text-success",
        tone === "negative" && "bg-danger/15 text-danger",
        tone === "neutral" && "bg-muted-bg text-muted",
      )}
      title={label}
    >
      <span aria-hidden>{glyph}</span>
      <span className="max-w-[5.5rem] truncate">{label}</span>
    </span>
  );
}

export function TopMoversTable({
  items,
  selectedSymbol,
  onSelect,
  companyNames = {},
  universeSize,
  intelligenceBySymbol = {},
}: Props) {
  const hasMl = rankingsHaveMlMetrics(items);

  return (
    <div className="app-panel overflow-hidden">
      <p className="border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        Ranked list
      </p>
      <ul className="divide-y divide-border">
        {items.map((item) => {
          const sym = item.symbol.toUpperCase();
          const selected = selectedSymbol === sym;
          const name = companyNames[sym];
          const intel = intelligenceBySymbol[sym];
          const trend =
            trendDisplayFromIntelligence(intel) ??
            trendDisplayFromRank(item.rank, items.length);
          const percentile = topUniverseLabel(
            item.rank,
            universeSize,
            items.length,
          );

          return (
            <li key={sym}>
              <button
                type="button"
                onClick={() => onSelect(sym)}
                className={cn(
                  "flex w-full gap-3 px-4 py-3.5 text-left transition-colors",
                  selected ? "bg-accent-muted/40" : "hover:bg-muted-bg/50",
                )}
                aria-current={selected ? "true" : undefined}
              >
                <span className="w-6 shrink-0 pt-0.5 font-mono text-sm tabular-nums text-muted">
                  {item.rank}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-sm font-semibold text-foreground">
                    {sym}
                  </span>
                  {name ? (
                    <span className="block truncate text-xs text-muted">{name}</span>
                  ) : null}
                  {hasMl ? (
                    <span className="mt-1 block font-mono text-[11px] text-muted">
                      {item.ml_probability != null
                        ? `P(SPY) ${formatProbability(item.ml_probability)}`
                        : null}
                      {item.ml_probability != null &&
                      item.expected_excess_return != null
                        ? " · "
                        : null}
                      {item.expected_excess_return != null
                        ? `Excess ${formatExcessReturn(item.expected_excess_return)}`
                        : null}
                    </span>
                  ) : null}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-right text-[11px] font-semibold text-accent">
                    {percentile}
                  </span>
                  <TrendChip
                    label={trend.label}
                    glyph={trend.symbol}
                    tone={trend.tone}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
