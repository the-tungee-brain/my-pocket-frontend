"use client";

import type { RankingItem } from "@/app/types/rankings";
import type { PatternIntelligence } from "@/app/types/intelligence";
import { ConvictionBadge } from "@/components/top-movers/ConvictionBadge";
import { ContributionSparkline } from "@/components/top-movers/ContributionSparkline";
import {
  formatExcessReturn,
  formatProbability,
  rankContext,
  rankingsHaveMlMetrics,
  convictionForRow,
  sparklineFromScores,
} from "@/lib/topMovers";
import { cn } from "@/lib/utils";

type Props = {
  items: RankingItem[];
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
  companyNames?: Record<string, string>;
  intelligenceBySymbol?: Record<string, PatternIntelligence | null | undefined>;
};

export function TopMoversTable({
  items,
  selectedSymbol,
  onSelect,
  companyNames = {},
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
          const ctx = rankContext(item, items);
          const conviction = convictionForRow(item.rank, items.length);
          const spark = sparklineFromScores(intel?.scores);

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
                <span className="w-8 shrink-0 pt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                  {ctx.rankLabel}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-sm font-semibold text-foreground">
                    {sym}
                  </span>
                  <span className="block text-xs text-muted">{ctx.subtitle}</span>
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
                  <ConvictionBadge tier={conviction.tier} label={conviction.label} />
                  <ContributionSparkline
                    values={spark}
                    pending={!intel}
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
