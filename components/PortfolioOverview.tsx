"use client";

import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import type { PositionMap } from "@/components/AccountPositionList";
import { Position, CashSecuredPutSummary as CashSecuredPutSummaryData, AssignmentRiskSummary as AssignmentRiskSummaryData } from "@/app/types/schwab";
import { useSchwabStatus } from "@/app/hooks/useSchwabStatus";
import { useSchwabConnect } from "@/app/hooks/useSchwabConnect";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { CashSecuredPutSummary } from "@/components/CashSecuredPutSummary";
import { AssignmentRiskSummary } from "@/components/AssignmentRiskSummary";
import { formatSignedUsd } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";

type Props = {
  loading: boolean;
  allPositions: Position[];
  symbols: string[];
  positionMap: PositionMap;
  cashSecuredPutSummary?: CashSecuredPutSummaryData | null;
  assignmentRiskSummary?: AssignmentRiskSummaryData | null;
  cashBalance?: number | null;
};

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
  cashSecuredPutSummary,
  assignmentRiskSummary,
  cashBalance,
}: Props) {
  const { authorized: schwabAuthorized, loading: schwabLoading } =
    useSchwabStatus();
  const {
    connect: connectSchwab,
    connecting: schwabConnecting,
    connectError: schwabConnectError,
    clearConnectError: clearSchwabConnectError,
  } = useSchwabConnect();

  const handleConnectSchwab = () => {
    clearSchwabConnectError();
    void connectSchwab();
  };

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
        <EmptyState
          icon={BriefcaseBusiness}
          title="No holdings yet"
          description={
            schwabAuthorized === false
              ? "Connect Schwab to import positions and unlock portfolio insights."
              : "Your Schwab account is connected, but no positions were returned. Holdings will appear here once available."
          }
          action={
            schwabAuthorized === false && !schwabLoading ? (
              <div className="space-y-2">
                {schwabConnectError && (
                  <p className="text-xs text-danger">{schwabConnectError}</p>
                )}
                <Button
                  size="sm"
                  disabled={schwabConnecting}
                  onClick={handleConnectSchwab}
                >
                  {schwabConnecting ? "Connecting…" : "Connect Schwab"}
                </Button>
              </div>
            ) : undefined
          }
        />
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
            {formatSignedUsd(totalDayPL)}
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

      {cashSecuredPutSummary && (
        <CashSecuredPutSummary
          summary={cashSecuredPutSummary}
          cashBalance={cashBalance}
          className="mb-4"
        />
      )}

      {assignmentRiskSummary && (
        <AssignmentRiskSummary
          summary={assignmentRiskSummary}
          className="mb-4"
        />
      )}

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
                    {formatSignedUsd(dayPL)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border sm:hidden">
          {symbolSummaries.map(({ symbol, positions, totalValue, dayPL }) => (
            <div
              key={symbol}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted-bg/40"
            >
              <div>
                <Link
                  href={`/portfolio/positions/${symbol}`}
                  className="font-mono font-medium text-foreground hover:text-accent-strong"
                >
                  {symbol}
                </Link>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-xs text-muted">
                    {positions.length}{" "}
                    {positions.length === 1 ? "position" : "positions"}
                  </p>
                  <Link
                    href={`/research/${symbol}/overview`}
                    className="text-[10px] font-medium text-muted hover:text-accent-strong"
                  >
                    Research
                  </Link>
                </div>
              </div>
              <Link
                href={`/portfolio/positions/${symbol}`}
                className="text-right"
              >
                <p className="tabular-nums font-medium">
                  ${totalValue.toLocaleString()}
                </p>
                <p
                  className={cn(
                    "text-xs tabular-nums",
                    dayPL >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {formatSignedUsd(dayPL)}
                </p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
