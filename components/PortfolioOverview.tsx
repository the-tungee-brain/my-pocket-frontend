"use client";

import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import type { PositionMap } from "@/components/AccountPositionList";
import { Position } from "@/app/types/schwab";
import { useSchwabStatus } from "@/app/hooks/useSchwabStatus";
import { cn } from "@/lib/utils";

type Props = {
  loading: boolean;
  allPositions: Position[];
  symbols: string[];
  positionMap: PositionMap;
};

function formatPL(value: number) {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type SymbolSummary = {
  symbol: string;
  positions: Position[];
  totalValue: number;
  dayPL: number;
};

function buildSymbolSummaries(positionMap: PositionMap): SymbolSummary[] {
  return Object.entries(positionMap)
    .map(([symbol, positions]) => ({
      symbol,
      positions,
      totalValue: positions.reduce((sum, p) => sum + p.marketValue, 0),
      dayPL: positions.reduce((sum, p) => sum + p.currentDayProfitLoss, 0),
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
}

export function PortfolioOverview({
  loading,
  allPositions,
  symbols,
  positionMap,
}: Props) {
  const { authorized: schwabAuthorized, loading: schwabLoading } =
    useSchwabStatus();

  const totalValue = allPositions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalDayPL = allPositions.reduce(
    (sum, p) => sum + p.currentDayProfitLoss,
    0,
  );
  const symbolSummaries = buildSymbolSummaries(positionMap);

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-4 space-y-2">
          <div className="h-6 w-40 animate-pulse rounded bg-muted-bg" />
          <div className="h-4 w-56 animate-pulse rounded bg-muted-bg" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-muted-bg"
            />
          ))}
        </div>
        <div className="mt-4 h-48 animate-pulse rounded-2xl bg-muted-bg" />
      </section>
    );
  }

  if (!allPositions.length) {
    return (
      <section className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-dashed border-border bg-muted-bg/30 px-6 py-10 text-center">
          <BriefcaseBusiness
            className="mx-auto mb-3 h-8 w-8 text-muted"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-foreground">
            No holdings yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {schwabAuthorized === false
              ? "Connect Schwab from the sidebar to import positions and unlock portfolio insights."
              : "Your Schwab account is connected, but no positions were returned. Holdings will appear here once available."}
          </p>
          {schwabAuthorized === false && !schwabLoading && (
            <p className="mx-auto mt-4 max-w-sm text-xs text-muted">
              On mobile, open the menu and use Connect at the bottom of the
              sidebar.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">My portfolio</h2>
        <p className="mt-0.5 text-sm text-muted">
          {symbols.length} {symbols.length === 1 ? "symbol" : "symbols"} ·{" "}
          {allPositions.length}{" "}
          {allPositions.length === 1 ? "position" : "positions"}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-secondary/60 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Total value
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            ${totalValue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/60 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Today P/L
          </p>
          <p
            className={cn(
              "mt-1 text-xl font-semibold tabular-nums",
              totalDayPL >= 0 ? "text-success" : "text-danger",
            )}
          >
            {formatPL(totalDayPL)}
          </p>
        </div>
        <div className="col-span-2 rounded-xl border border-border bg-secondary/60 px-4 py-3 sm:col-span-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Symbols
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {symbols.length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm">
        <div className="hidden sm:block">
          <table className="w-full table-fixed text-sm">
            <thead className="border-b border-border bg-surface-elevated/60 text-[11px] font-medium uppercase tracking-wide text-muted">
              <tr>
                <th className="w-1/4 px-4 py-2.5 text-left">Symbol</th>
                <th className="w-1/4 px-4 py-2.5 text-right">Positions</th>
                <th className="w-1/4 px-4 py-2.5 text-right">Value</th>
                <th className="w-1/4 px-4 py-2.5 text-right">Today P/L</th>
              </tr>
            </thead>
            <tbody>
              {symbolSummaries.map(({ symbol, positions, totalValue, dayPL }) => (
                <tr
                  key={symbol}
                  className="border-t border-border transition-colors hover:bg-muted-bg/40"
                >
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/portfolio/positions/${symbol}`}
                        className="font-mono font-medium text-foreground hover:text-accent-strong"
                      >
                        {symbol}
                      </Link>
                      <Link
                        href={`/research/${symbol}/overview`}
                        className="text-[10px] font-medium text-muted hover:text-accent-strong"
                      >
                        Research
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">
                    {positions.length}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    ${totalValue.toLocaleString()}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right tabular-nums",
                      dayPL >= 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {formatPL(dayPL)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border sm:hidden">
          {symbolSummaries.map(({ symbol, positions, totalValue, dayPL }) => (
            <Link
              key={symbol}
              href={`/portfolio/positions/${symbol}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted-bg/40"
            >
              <div>
                <p className="font-mono font-medium text-foreground">{symbol}</p>
                <p className="text-xs text-muted">
                  {positions.length}{" "}
                  {positions.length === 1 ? "position" : "positions"}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular-nums font-medium">
                  ${totalValue.toLocaleString()}
                </p>
                <p
                  className={cn(
                    "text-xs tabular-nums",
                    dayPL >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {formatPL(dayPL)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
