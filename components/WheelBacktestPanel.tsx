"use client";

import { useCallback, useMemo, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import type { WheelBacktestResult, WheelBacktestYears } from "@/app/types/wheelBacktest";
import { formatDateMMDDYYYY } from "@/lib/dateUtils";
import { fetchWheelBacktest } from "@/lib/wheelBacktest";
import { WheelBacktestTradeLedger } from "@/components/WheelBacktestTradeLedger";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { cn } from "@/lib/utils";

function formatUsd(value: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(value);
}

function formatPct(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

function formatSignedUsd(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatUsd(Math.abs(value))}`;
}

function plTone(value: number) {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-foreground";
}

type Props = {
  accessToken: string;
  symbols: string[];
  targetDeltaMin?: number;
  targetDeltaMax?: number;
  dteDays?: number;
  className?: string;
};

const YEAR_OPTIONS: WheelBacktestYears[] = [5, 10, 15];

export function WheelBacktestPanel({
  accessToken,
  symbols,
  targetDeltaMin = 0.2,
  targetDeltaMax = 0.3,
  dteDays = 30,
  className,
}: Props) {
  const choices = useMemo(
    () => [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))],
    [symbols],
  );
  const [symbol, setSymbol] = useState(choices[0] ?? "");
  const [years, setYears] = useState<WheelBacktestYears>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WheelBacktestResult | null>(null);

  const run = useCallback(async () => {
    if (!symbol) {
      setError("Pick a symbol to backtest.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWheelBacktest(accessToken, {
        symbol,
        years,
        targetDeltaMin,
        targetDeltaMax,
        dteDays,
        contracts: 1,
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Backtest failed.");
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    symbol,
    years,
    targetDeltaMin,
    targetDeltaMax,
    dteDays,
  ]);

  if (choices.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border bg-background/50 px-3 py-4 text-xs text-muted",
          className,
        )}
      >
        Add a wheel symbol in settings to run a historical backtest.
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border/80 bg-background/60", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-3 py-3">
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
            <BarChart3 className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Wheel backtest
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              One contract: fund the first CSP, run the wheel for the horizon, report
              ending equity vs that starting wallet (no extra deposits unless you enable
              maintain-one-lot). Model premiums — not historical option quotes.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-3 py-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[7rem] flex-col gap-1 text-[11px] font-medium text-muted">
            Symbol
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
            >
              {choices.map((ticker) => (
                <option key={ticker} value={ticker}>
                  {ticker}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-medium text-muted">
            Horizon
            <select
              value={years}
              onChange={(e) => setYears(Number(e.target.value) as WheelBacktestYears)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y} years
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            size="sm"
            onClick={() => void run()}
            disabled={loading || !symbol}
            className="h-9"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Running…
              </>
            ) : (
              "Run backtest"
            )}
          </Button>
        </div>

        <p className="text-[10px] leading-relaxed text-muted">
          Uses your wheel delta band ({targetDeltaMin.toFixed(2)}–
          {targetDeltaMax.toFixed(2)}) and ~{dteDays} trading-day DTE (~1 month).
          European expiration at daily close; model premiums (realized vol).
        </p>

        {error && (
          <ErrorBanner message={error} onRetry={() => void run()} className="text-left" />
        )}

        {result && (
          <div className="space-y-3">
            <div className="rounded-lg border border-accent/25 bg-accent-muted/20 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Capital (1 contract = 100 shares)
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[10px] text-muted">Stock at first trade</p>
                  <p className="text-sm font-semibold text-foreground">
                    ${result.initialStockPriceUsd.toFixed(2)}/sh
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {formatDateMMDDYYYY(result.startDate)} (split-adjusted)
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted">Cash secured (CSP)</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatUsd(result.initialCollateralUsd)}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                    Put strike ${result.initialPutStrikeUsd.toFixed(2)} × 100 sh
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted">Starting wallet</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatUsd(result.startingCashUsd)}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                    Collateral + 5% buffer (premium adds on top)
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted">Ending equity</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatUsd(result.endingEquityUsd)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    Cash + stock mark at {formatDateMMDDYYYY(result.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted">
                    Total P/L ({formatDateMMDDYYYY(result.startDate)} –{" "}
                    {formatDateMMDDYYYY(result.endDate)})
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      plTone(result.totalPlUsd ?? result.endingEquityUsd - result.startingCashUsd),
                    )}
                  >
                    {formatSignedUsd(
                      result.totalPlUsd ??
                        result.endingEquityUsd - result.startingCashUsd,
                    )}{" "}
                    <span className="text-xs font-medium">
                      ({formatPct(result.totalReturnPct, 2)})
                    </span>
                  </p>
                  {result.cagrPct != null && (
                    <p className="mt-0.5 text-[10px] text-muted">
                      CAGR {formatPct(result.cagrPct)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {(result.capitalTopUpsUsd ?? 0) === 0 &&
              (result.skippedTradesInsufficientCash ?? 0) > 0 && (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-foreground">
                  Fixed starting wallet only — could not open a new CSP on{" "}
                  {result.skippedTradesInsufficientCash} days when collateral exceeded
                  cash (premiums and stock P/L still compound in the account).
                </p>
              )}

            {(result.capitalTopUpsUsd ?? 0) > 0 && (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-foreground">
                Maintain-one-lot mode added {formatUsd(result.capitalTopUpsUsd)} beyond
                the starting wallet so CSPs could continue as the stock rose. Total P/L
                is vs that full amount deposited, not the initial wallet alone.
              </p>
            )}

            <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5 text-xs">
              <p className="font-medium text-foreground">Stock price (underlying)</p>
              <p className="mt-1 text-muted">
                {formatDateMMDDYYYY(result.startDate)}: $
                {result.spotPriceAtStart.toFixed(2)} →{" "}
                {formatDateMMDDYYYY(result.endDate)}: $
                {result.spotPriceAtEnd.toFixed(2)}
              </p>
              <p className="mt-1 text-[10px] text-muted">
                Buy & hold with same {formatUsd(result.startingCashUsd)} start:{" "}
                {formatUsd(result.buyAndHoldEndingUsd)} ending (
                {formatPct(result.buyAndHoldReturnPct, 2)})
              </p>
            </div>

            {result.wheelCycles.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Stock entry & exit (assigned cycles)
                </p>
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-muted">
                        <th className="px-2 py-1.5 font-medium">#</th>
                        <th className="px-2 py-1.5 font-medium">Entry</th>
                        <th className="px-2 py-1.5 font-medium text-right">
                          Entry $
                        </th>
                        <th className="px-2 py-1.5 font-medium text-right">
                          Exit
                        </th>
                        <th className="px-2 py-1.5 font-medium text-right">
                          Exit $
                        </th>
                        <th className="px-2 py-1.5 font-medium text-right">
                          Stock P/L
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.wheelCycles.map((cycle) => {
                        const stockPl = cycle.stockRoundTripPlUsd;
                        return (
                          <tr
                            key={cycle.cycle}
                            className="border-b border-border/40 text-foreground"
                          >
                            <td className="px-2 py-1.5">{cycle.cycle}</td>
                            <td className="px-2 py-1.5 text-muted">
                              {cycle.stockEntryDate
                                ? formatDateMMDDYYYY(cycle.stockEntryDate)
                                : "—"}
                              {cycle.effectiveEntryPrice != null && (
                                <span className="block text-[10px]">
                                  eff. ${cycle.effectiveEntryPrice.toFixed(2)}/sh
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              {cycle.stockEntryClose != null
                                ? `$${cycle.stockEntryClose.toFixed(2)}`
                                : "—"}
                            </td>
                            <td className="px-2 py-1.5 text-right text-muted">
                              {cycle.completed && cycle.stockExitDate
                                ? formatDateMMDDYYYY(cycle.stockExitDate)
                                : "Open / incomplete"}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              {cycle.stockExitClose != null
                                ? `$${cycle.stockExitClose.toFixed(2)}`
                                : "—"}
                              {cycle.effectiveExitPrice != null && (
                                <span className="block text-[10px] text-muted">
                                  call ${cycle.effectiveExitPrice.toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td
                              className={cn(
                                "px-2 py-1.5 text-right font-medium tabular-nums",
                                stockPl != null && plTone(stockPl),
                              )}
                            >
                              {stockPl != null ? formatSignedUsd(stockPl) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Metric
                label="Buy & hold (same $ start)"
                value={formatPct(result.buyAndHoldReturnPct, 2)}
                sub={
                  result.buyAndHoldCagrPct != null
                    ? `CAGR ${formatPct(result.buyAndHoldCagrPct)} · ${formatUsd(result.buyAndHoldEndingUsd)} end`
                    : formatUsd(result.buyAndHoldEndingUsd)
                }
              />
              <Metric
                label="Premium collected"
                value={formatUsd(result.totalPremiumCollectedUsd)}
                sub={`Fees ${formatUsd(result.totalFeesUsd)} · Div ${formatUsd(result.totalDividendsUsd)}`}
              />
              <Metric
                label="Wheel cycles"
                value={String(result.completedWheelCycles)}
                sub={`${result.putAssignments} put assigns · ${result.callsAssigned} call assigns`}
              />
            </div>

            <p className="text-[10px] text-muted">
              {formatDateMMDDYYYY(result.startDate)} →{" "}
              {formatDateMMDDYYYY(result.endDate)} · {result.tradingDays} trading days
            </p>

            {result.annualSummary.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Year by year
                </p>
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full min-w-[480px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-muted">
                        <th className="px-2 py-1.5 font-medium">Year</th>
                        <th className="px-2 py-1.5 font-medium text-right">Start</th>
                        <th className="px-2 py-1.5 font-medium text-right">End</th>
                        <th className="px-2 py-1.5 font-medium text-right">P/L $</th>
                        <th className="px-2 py-1.5 font-medium text-right">P/L %</th>
                        <th className="px-2 py-1.5 font-medium text-right">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.annualSummary.map((row) => {
                        const pl =
                          row.plUsd ?? row.endEquityUsd - row.startEquityUsd;
                        return (
                          <tr
                            key={row.year}
                            className="border-b border-border/40 text-foreground"
                          >
                            <td className="px-2 py-1.5 font-medium">{row.year}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              {formatUsd(row.startEquityUsd)}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              {formatUsd(row.endEquityUsd)}
                            </td>
                            <td
                              className={cn(
                                "px-2 py-1.5 text-right font-medium tabular-nums",
                                plTone(pl),
                              )}
                            >
                              {formatSignedUsd(pl)}
                            </td>
                            <td
                              className={cn(
                                "px-2 py-1.5 text-right font-medium tabular-nums",
                                plTone(row.returnPct),
                              )}
                            >
                              {formatPct(row.returnPct, 2)}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-muted">
                              {formatUsd(row.premiumUsd)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.trades.length > 0 && (
              <WheelBacktestTradeLedger trades={result.trades} />
            )}

            <details className="text-xs text-muted">
              <summary className="cursor-pointer font-medium text-foreground">
                Model assumptions
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {result.assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted">{sub}</p>}
    </div>
  );
}
