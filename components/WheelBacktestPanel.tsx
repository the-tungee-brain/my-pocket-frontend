"use client";

import { useCallback, useMemo, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import type { WheelBacktestResult, WheelBacktestYears } from "@/app/types/wheelBacktest";
import { fetchWheelBacktest } from "@/lib/wheelBacktest";
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

function formatPct(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
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
  dteDays = 7,
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
              Simulated CSP → assignment → covered call cycles on daily history.
              Model-based premiums — not live historical option quotes.
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
          {targetDeltaMax.toFixed(2)}) and {dteDays}-day DTE steps. European
          expiration at daily close; 95% of Black-Scholes premium (realized vol).
        </p>

        {error && (
          <ErrorBanner message={error} onRetry={() => void run()} className="text-left" />
        )}

        {result && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Wheel return"
                value={formatPct(result.totalReturnPct)}
                sub={result.cagrPct != null ? `CAGR ${formatPct(result.cagrPct)}` : undefined}
              />
              <Metric
                label="Buy & hold"
                value={formatPct(result.buyAndHoldReturnPct)}
                sub={
                  result.buyAndHoldCagrPct != null
                    ? `CAGR ${formatPct(result.buyAndHoldCagrPct)}`
                    : undefined
                }
              />
              <Metric
                label="Premium collected"
                value={formatUsd(result.totalPremiumCollectedUsd)}
                sub={`Fees ${formatUsd(result.totalFeesUsd)}`}
              />
              <Metric
                label="Cycles completed"
                value={String(result.completedWheelCycles)}
                sub={`${result.putAssignments} put assigns · ${result.callsAssigned} call assigns`}
              />
            </div>

            <div className="grid gap-2 text-xs text-muted sm:grid-cols-3">
              <span>Ending equity {formatUsd(result.endingEquityUsd)}</span>
              <span>Dividends {formatUsd(result.totalDividendsUsd)}</span>
              <span>
                {result.startDate} → {result.endDate}
              </span>
            </div>

            {result.annualSummary.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full min-w-[320px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted">
                      <th className="px-2 py-1.5 font-medium">Year</th>
                      <th className="px-2 py-1.5 font-medium">Return</th>
                      <th className="px-2 py-1.5 font-medium">Premium</th>
                      <th className="px-2 py-1.5 font-medium">End equity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.annualSummary.map((row) => (
                      <tr key={row.year} className="border-b border-border/40 text-foreground">
                        <td className="px-2 py-1.5">{row.year}</td>
                        <td className="px-2 py-1.5">{formatPct(row.returnPct)}</td>
                        <td className="px-2 py-1.5">{formatUsd(row.premiumUsd)}</td>
                        <td className="px-2 py-1.5">{formatUsd(row.endEquityUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
