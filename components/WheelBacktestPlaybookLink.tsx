"use client";

import Link from "next/link";
import { BarChart3, ChevronRight } from "lucide-react";
import { wheelBacktestPath } from "@/lib/wheelBacktestRoutes";
import { cn } from "@/lib/utils";

type Props = {
  symbols: string[];
  className?: string;
};

export function WheelBacktestPlaybookLink({ symbols, className }: Props) {
  const choices = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))];

  if (choices.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-background/60 px-3 py-3",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted/80 text-accent-strong">
          <BarChart3 className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Historical backtest
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            Run a full chart and trade log on the symbol&apos;s research page —
            same delta band and DTE as your wheel settings.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {choices.map((ticker) => (
          <Link
            key={ticker}
            href={wheelBacktestPath(ticker, { years: 5, run: true })}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-accent/30 bg-accent-muted/30 px-3 text-xs font-medium text-accent-strong transition hover:bg-accent-muted/50"
          >
            {choices.length === 1 ? "Open backtest" : `Backtest ${ticker}`}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
