"use client";

import { Check, Plus, Sparkles } from "lucide-react";
import type { StrategyStockPick } from "@/app/types/strategy";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  picks: StrategyStockPick[];
  summary?: string | null;
  loading?: boolean;
  error?: string | null;
  onAddSymbol: (symbol: string) => void;
  selectedSymbols?: string[];
  className?: string;
  compact?: boolean;
};

export function StrategyStockSuggestionsPanel({
  picks,
  summary,
  loading = false,
  error = null,
  onAddSymbol,
  selectedSymbols = [],
  className,
  compact = false,
}: Props) {
  const selected = new Set(selectedSymbols.map((symbol) => symbol.toUpperCase()));

  if (!loading && !error && picks.length === 0 && !summary) {
    return null;
  }

  const topPick = picks[0];
  const otherPicks = picks.slice(1);
  const addableCount = picks.filter(
    (pick) => !selected.has(pick.symbol.toUpperCase()),
  ).length;

  return (
    <div
      className={cn(
        "rounded-xl border border-accent/25 bg-accent-muted/15 p-3",
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">
            AI suggestions for your strategy
          </p>
          {!compact && summary && (
            <p className="mt-1 text-xs leading-relaxed text-muted">{summary}</p>
          )}
        </div>
      </div>

      {loading && (
        <p className="text-xs text-muted">Finding symbols that fit your preferences…</p>
      )}

      {error && !loading && (
        <p className="text-xs text-muted">
          Suggestions are unavailable right now. You can still search and add symbols
          manually.
        </p>
      )}

      {!loading && !error && picks.length === 0 && summary && (
        <p className="text-xs text-muted">{summary}</p>
      )}

      {!loading && !error && picks.length > 0 && addableCount === 0 && (
        <p className="text-xs text-muted">
          Your current list already includes these suggestions. Edit symbols above to
          get fresh ideas.
        </p>
      )}

      {!loading && topPick && (
        <div className="space-y-2">
          <SuggestionCard
            pick={topPick}
            badge="Top pick"
            added={selected.has(topPick.symbol.toUpperCase())}
            onAdd={() => onAddSymbol(topPick.symbol)}
          />

          {otherPicks.length > 0 && (
            <div className="space-y-2">
              {otherPicks.map((pick) => (
                <SuggestionCard
                  key={pick.symbol}
                  pick={pick}
                  added={selected.has(pick.symbol.toUpperCase())}
                  onAdd={() => onAddSymbol(pick.symbol)}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({
  pick,
  badge,
  added = false,
  onAdd,
  compact = false,
}: {
  pick: StrategyStockPick;
  badge?: string;
  added?: boolean;
  onAdd: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background/60 px-3 py-2.5",
        compact && "py-2",
        added && "opacity-80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{pick.symbol}</p>
            {pick.companyName && (
              <p className="truncate text-xs text-muted">{pick.companyName}</p>
            )}
            {badge && (
              <span className="rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-strong">
                {badge}
              </span>
            )}
            {pick.fitScore > 0 && (
              <span className="text-[10px] text-muted">
                {Math.round(pick.fitScore * 100)}% fit
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">{pick.rationale}</p>
          {pick.tags && pick.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {pick.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted"
                >
                  {tag.replaceAll("-", " ")}
                </span>
              ))}
            </div>
          )}
        </div>
        {added ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-muted/40 px-2 py-1 text-[10px] font-medium text-accent-strong">
            <Check className="h-3 w-3" />
            Added
          </span>
        ) : (
          <Button size="xs" variant="outline" onClick={onAdd}>
            <Plus className="h-3 w-3" />
            Add
          </Button>
        )}
      </div>
    </div>
  );
}
