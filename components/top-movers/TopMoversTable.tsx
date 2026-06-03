"use client";

import type { RankingItem } from "@/app/types/rankings";
import {
  formatExcessReturn,
  formatProbability,
  trendIndicatorFromProbability,
} from "@/lib/topMovers";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

type Props = {
  items: RankingItem[];
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
  companyNames?: Record<string, string>;
};

function TrendGlyph({ tone }: { tone: "positive" | "neutral" | "negative" }) {
  const className = "h-3.5 w-3.5 shrink-0";
  if (tone === "positive") {
    return <TrendingUp className={cn(className, "text-success")} aria-hidden />;
  }
  if (tone === "negative") {
    return <TrendingDown className={cn(className, "text-danger")} aria-hidden />;
  }
  return <Minus className={cn(className, "text-muted")} aria-hidden />;
}

export function TopMoversTable({
  items,
  selectedSymbol,
  onSelect,
  companyNames = {},
}: Props) {
  const rowGridClass =
    "grid w-full min-w-[22rem] grid-cols-[2.25rem_minmax(0,1fr)_3.25rem_3.75rem_1.25rem] gap-x-2 gap-y-0.5 sm:min-w-0 sm:grid-cols-[2.5rem_minmax(0,1fr)_3.5rem_4rem_1.25rem]";

  return (
    <div className="app-panel overflow-x-auto">
      <div className="min-w-[22rem] sm:min-w-0">
        <div
          className={cn(
            rowGridClass,
            "border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted",
          )}
        >
          <span>#</span>
          <span>Symbol</span>
          <span className="shrink-0 text-right">P(SPY)</span>
          <span className="shrink-0 text-right">Excess</span>
          <span className="sr-only">Trend</span>
        </div>
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const sym = item.symbol.toUpperCase();
            const selected = selectedSymbol === sym;
            const trend = trendIndicatorFromProbability(item.ml_probability);
            const name = companyNames[sym];

            return (
              <li key={sym}>
                <button
                  type="button"
                  onClick={() => onSelect(sym)}
                  className={cn(
                    rowGridClass,
                    "px-3 py-3 text-left transition-colors",
                    selected
                      ? "bg-accent-muted/40"
                      : "hover:bg-muted-bg/50",
                  )}
                  aria-current={selected ? "true" : undefined}
                >
                  <span className="shrink-0 font-mono text-sm tabular-nums text-muted">
                    {item.rank}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-sm font-semibold text-foreground">
                      {sym}
                    </span>
                    {name ? (
                      <span className="block truncate text-xs text-muted">{name}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 self-center text-right font-mono text-sm tabular-nums text-foreground">
                    {formatProbability(item.ml_probability)}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 self-center text-right font-mono text-sm tabular-nums",
                      item.expected_excess_return != null && item.expected_excess_return >= 0
                        ? "text-success"
                        : "text-foreground",
                    )}
                  >
                    {formatExcessReturn(item.expected_excess_return)}
                  </span>
                  <span
                    className="flex shrink-0 items-center justify-end"
                    title={trend.label}
                  >
                    <TrendGlyph tone={trend.tone} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
