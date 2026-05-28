"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { BarChart3, ChevronDown, Download, Loader2 } from "lucide-react";
import type {
  WheelBacktestCallStrikeMode,
  WheelBacktestResult,
  WheelBacktestYears,
} from "@/app/types/wheelBacktest";
import { formatDateMMDDYYYY } from "@/lib/dateUtils";
import { downloadWheelBacktestResult } from "@/lib/wheelBacktestExport";
import { fetchWheelBacktest } from "@/lib/wheelBacktest";
import {
  DEFAULT_WHEEL_BACKTEST_DTE_DAYS,
  WHEEL_BACKTEST_DTE_PRESETS,
  type WheelBacktestDteDays,
  wheelBacktestDteLabel,
} from "@/lib/wheelBacktestDte";
import { WheelBacktestCharts } from "@/components/WheelBacktestCharts";
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
  /** When set, symbol is fixed (research page) and the picker is hidden. */
  fixedSymbol?: string;
  targetDeltaMin?: number;
  targetDeltaMax?: number;
  defaultDteDays?: WheelBacktestDteDays;
  defaultYears?: WheelBacktestYears;
  defaultMaintainOneLot?: boolean;
  defaultCallStrikeMode?: WheelBacktestCallStrikeMode;
  /** Run once on load (e.g. from playbook deep link with ?run=1). */
  autoRun?: boolean;
  variant?: "embedded" | "research";
  className?: string;
};

const YEAR_OPTIONS: WheelBacktestYears[] = [5, 10, 15];

const selectControlClass =
  "h-9 w-full appearance-none rounded-lg border border-border bg-background py-0 pl-3 pr-9 text-sm text-foreground shadow-none transition-colors hover:border-accent/35 focus:border-accent/50 focus:outline-none";

export function WheelBacktestPanel({
  accessToken,
  symbols,
  fixedSymbol,
  targetDeltaMin = 0.2,
  targetDeltaMax = 0.3,
  defaultDteDays = DEFAULT_WHEEL_BACKTEST_DTE_DAYS,
  defaultYears = 5,
  defaultMaintainOneLot = true,
  defaultCallStrikeMode = "delta",
  autoRun = false,
  variant = "embedded",
  className,
}: Props) {
  const choices = useMemo(
    () => [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))],
    [symbols],
  );
  const lockedSymbol = fixedSymbol?.trim().toUpperCase() ?? "";
  const [symbol, setSymbol] = useState((lockedSymbol || choices[0]) ?? "");
  const [years, setYears] = useState<WheelBacktestYears>(defaultYears);
  const [dteDays, setDteDays] = useState<WheelBacktestDteDays>(defaultDteDays);
  const [maintainOneLot, setMaintainOneLot] = useState(defaultMaintainOneLot);
  const [callStrikeMode, setCallStrikeMode] =
    useState<WheelBacktestCallStrikeMode>(defaultCallStrikeMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WheelBacktestResult | null>(null);
  const autoRanRef = useRef(false);

  useEffect(() => {
    if (lockedSymbol) {
      setSymbol(lockedSymbol);
    }
  }, [lockedSymbol]);

  useEffect(() => {
    setYears(defaultYears);
  }, [defaultYears]);

  useEffect(() => {
    setDteDays(defaultDteDays);
  }, [defaultDteDays]);

  useEffect(() => {
    setMaintainOneLot(defaultMaintainOneLot);
  }, [defaultMaintainOneLot]);

  useEffect(() => {
    setCallStrikeMode(defaultCallStrikeMode);
  }, [defaultCallStrikeMode]);

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
        maintainOneLot,
        callStrikeMode,
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
    maintainOneLot,
    callStrikeMode,
  ]);

  useEffect(() => {
    if (!autoRun || autoRanRef.current || !symbol) return;
    autoRanRef.current = true;
    void run();
    // Intentionally run once when opened via ?run=1 from playbook.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run() is stable enough for one-shot autoRun
  }, [autoRun, symbol]);

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

  const showSymbolPicker = !lockedSymbol && choices.length > 1;
  const isResearch = variant === "research";

  return (
    <div
      className={cn(
        isResearch ? "space-y-3" : "rounded-xl border border-border/80 bg-background/60",
        className,
      )}
    >
      {!isResearch && (
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
                One contract: fund the first CSP, then keep selling one CSP at a time. If
                the stock rises and your wallet cannot cover strike × 100, you can
                simulate adding more cash (see below). Model premiums — not historical
                option quotes.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={cn("space-y-3", !isResearch && "px-3 py-3")}>
        <div className="rounded-lg border border-border/80 bg-muted-bg/40 p-3">
          <div className="flex flex-wrap items-end gap-3">
            {showSymbolPicker && (
              <WheelSelect
                id="wheel-backtest-symbol"
                label="Symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                wrapperClassName="min-w-[7rem]"
              >
                {choices.map((ticker) => (
                  <option key={ticker} value={ticker}>
                    {ticker}
                  </option>
                ))}
              </WheelSelect>
            )}

            <WheelSelect
              id="wheel-backtest-years"
              label="Horizon"
              value={String(years)}
              onChange={(e) =>
                setYears(Number(e.target.value) as WheelBacktestYears)
              }
              wrapperClassName="min-w-[6.5rem]"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y} years
                </option>
              ))}
            </WheelSelect>

            <WheelSelect
              id="wheel-backtest-dte"
              label="DTE"
              value={String(dteDays)}
              onChange={(e) =>
                setDteDays(Number(e.target.value) as WheelBacktestDteDays)
              }
              wrapperClassName="min-w-[7.5rem]"
            >
              {WHEEL_BACKTEST_DTE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </WheelSelect>

            <label
              className="flex h-9 cursor-pointer items-center gap-2 text-[11px] text-muted"
              title="When the next CSP needs more cash secured than you have, add the difference so the wheel can continue"
            >
              <input
                type="checkbox"
                checked={maintainOneLot}
                onChange={(e) => setMaintainOneLot(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-border accent-[var(--accent)]"
              />
              <span className="leading-tight text-foreground">
                Add cash if CSP needs more
              </span>
            </label>

            <label
              className="flex h-9 cursor-pointer items-center gap-2 text-[11px] text-muted"
              title="After put assignment, sell covered calls only at listed strikes at or above the assignment put strike"
            >
              <input
                type="checkbox"
                checked={callStrikeMode === "at_or_above_assignment"}
                onChange={(e) =>
                  setCallStrikeMode(
                    e.target.checked ? "at_or_above_assignment" : "delta",
                  )
                }
                className="h-4 w-4 shrink-0 rounded border-border accent-[var(--accent)]"
              />
              <span className="leading-tight text-foreground">
                Calls at/above assign strike
              </span>
            </label>

            <Button
              type="button"
              size="sm"
              onClick={() => void run()}
              disabled={loading || !symbol}
              className="h-9 shrink-0 px-4"
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
        </div>

        <p className="text-[10px] leading-relaxed text-muted">
          Uses your wheel delta band ({targetDeltaMin.toFixed(2)}–
          {targetDeltaMax.toFixed(2)}) and {wheelBacktestDteLabel(dteDays)} per leg.
          European expiration at daily close; model premiums (realized vol).
        </p>

        {error && (
          <ErrorBanner message={error} onRetry={() => void run()} className="text-left" />
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-3 text-[11px]"
                onClick={() =>
                  downloadWheelBacktestResult(result, {
                    symbol,
                    lookbackYears: years,
                    targetDeltaMin,
                    targetDeltaMax,
                    dteDays,
                    maintainOneLot,
                    callStrikeMode,
                  })
                }
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                Download PDF
              </Button>
            </div>

            <div className="rounded-lg border border-accent/25 bg-accent-muted/20 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Capital (1 contract = 100 shares)
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[10px] text-muted">Stock at first trade</p>
                  <p className="text-sm font-semibold text-foreground">
                    ${result.spotPriceAtStart.toFixed(2)}/sh
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    First CSP · {formatDateMMDDYYYY(result.startDate)} ·
                    total-return adjusted
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
                {(result.capitalTopUpsUsd ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] text-muted">Extra cash added later</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatUsd(result.capitalTopUpsUsd)}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                      All money you put in{" "}
                      {formatUsd(
                        result.startingCashUsd + (result.capitalTopUpsUsd ?? 0),
                      )}
                    </p>
                  </div>
                )}
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
                      {(result.capitalTopUpsUsd ?? 0) > 0
                        ? " on all money put in"
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {(result.capitalTopUpsUsd ?? 0) === 0 &&
              (result.cspRounds ?? 0) > 0 &&
              result.lastTradeDate &&
              result.lastTradeDate < result.endDate && (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-foreground">
                  Only {result.cspRounds} CSP round
                  {result.cspRounds === 1 ? "" : "s"} in {result.lookbackYears} years.
                  Last trade {formatDateMMDDYYYY(result.lastTradeDate)} — wallet{" "}
                  {formatUsd(result.endingEquityUsd)} could not secure the next CSP
                  (cash secured ≈ strike × 100; SPY rose faster than this fixed
                  account). Turn on &quot;Add cash if CSP needs more&quot; to simulate
                  depositing when collateral rises.
                </p>
              )}

            {(result.capitalTopUpsUsd ?? 0) > 0 && (
              <p className="rounded-md border border-border/60 bg-secondary/30 px-2.5 py-2 text-[11px] leading-relaxed text-foreground">
                The stock outgrew your starting wallet — each new CSP needed more than{" "}
                {formatUsd(result.startingCashUsd)} cash secured (strike × 100). The
                run added {formatUsd(result.capitalTopUpsUsd)} in extra deposits so you
                could keep one CSP on. Return % is on{" "}
                {formatUsd(
                  result.startingCashUsd + (result.capitalTopUpsUsd ?? 0),
                )}{" "}
                total put in, not the first deposit alone.
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

            {result.equityCurve.length > 0 && (
              <WheelBacktestCharts
                equityCurve={result.equityCurve}
                trades={result.trades}
                annualSummary={result.annualSummary}
                startDate={result.startDate}
                endDate={result.endDate}
                startingCashUsd={result.startingCashUsd}
              />
            )}

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
                label="CSP rounds"
                value={String(result.cspRounds ?? 0)}
                sub={`${result.completedWheelCycles} full wheels (assign → called away) · ${result.putAssignments} put / ${result.callsAssigned} call assigns`}
              />
            </div>

            <p className="text-[10px] text-muted">
              History {formatDateMMDDYYYY(result.historyStartDate ?? result.startDate)}{" "}
              → {formatDateMMDDYYYY(result.endDate)} ({result.tradingDays} bars) ·
              trades {formatDateMMDDYYYY(result.startDate)} →{" "}
              {formatDateMMDDYYYY(result.endDate)}
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

function WheelSelect({
  id,
  label,
  value,
  onChange,
  children,
  wrapperClassName,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  wrapperClassName?: string;
}) {
  return (
    <label htmlFor={id} className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <span className="text-[11px] font-medium text-muted">{label}</span>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={selectControlClass}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
      </div>
    </label>
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
