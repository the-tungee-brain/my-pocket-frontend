"use client";

import { ArrowDownRight, ArrowUpRight, GitCompareArrows, Plus, Minus } from "lucide-react";
import type { PortfolioChanges } from "@/app/types/intelligence";
import { cn } from "@/lib/utils";

type Props = {
  changes: PortfolioChanges | null | undefined;
  loading?: boolean;
  className?: string;
};

function formatPct(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

export function PortfolioChangesSection({ changes, loading = false, className }: Props) {
  if (loading) {
    return (
      <section
        className={cn(
          "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm",
          className,
        )}
      >
        <div className="space-y-2 px-4 py-4">
          <div className="h-4 w-40 animate-pulse rounded bg-muted-bg" />
          <div className="h-16 animate-pulse rounded-xl bg-muted-bg" />
        </div>
      </section>
    );
  }

  if (!changes?.summary) return null;

  const hasDetails =
    (changes.newSymbols?.length ?? 0) > 0 ||
    (changes.removedSymbols?.length ?? 0) > 0 ||
    (changes.weightChanges?.length ?? 0) > 0 ||
    changes.liquidationValueChangePct != null;

  if (!hasDetails && !changes.summary) return null;

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm",
        className,
      )}
      aria-label="Portfolio changes"
    >
      <div className="flex items-start gap-3 border-b border-border bg-surface-elevated/50 px-4 py-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
          <GitCompareArrows className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Since yesterday</h2>
          <p className="text-[11px] text-muted">{changes.summary}</p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {changes.liquidationValueChangePct != null && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5">
            {changes.liquidationValueChangePct >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-600" aria-hidden />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-danger" aria-hidden />
            )}
            <span className="text-sm text-foreground">
              Portfolio value{" "}
              <span className="font-semibold tabular-nums">
                {formatPct(changes.liquidationValueChangePct)}
              </span>
            </span>
          </div>
        )}

        {(changes.newSymbols?.length ?? 0) > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Added
            </p>
            <div className="flex flex-wrap gap-2">
              {changes.newSymbols.map((symbol) => (
                <span
                  key={symbol}
                  className="rounded-full border border-border bg-background px-3 py-1 font-mono text-[11px]"
                >
                  {symbol}
                </span>
              ))}
            </div>
          </div>
        )}

        {(changes.removedSymbols?.length ?? 0) > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              <Minus className="h-3.5 w-3.5" aria-hidden />
              Removed
            </p>
            <div className="flex flex-wrap gap-2">
              {changes.removedSymbols.map((symbol) => (
                <span
                  key={symbol}
                  className="rounded-full border border-border bg-background px-3 py-1 font-mono text-[11px]"
                >
                  {symbol}
                </span>
              ))}
            </div>
          </div>
        )}

        {(changes.weightChanges?.length ?? 0) > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
              Largest weight shifts
            </p>
            <ul className="space-y-2">
              {changes.weightChanges.slice(0, 4).map((item) => (
                <li
                  key={item.symbol}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3 py-2"
                >
                  <span className="font-mono text-sm font-medium">{item.symbol}</span>
                  <span className="text-xs tabular-nums text-muted">
                    {item.previousWeightPct.toFixed(1)}% → {item.currentWeightPct.toFixed(1)}%
                    <span
                      className={cn(
                        "ml-2 font-semibold",
                        item.changePct >= 0 ? "text-emerald-600" : "text-danger",
                      )}
                    >
                      {formatPct(item.changePct)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
