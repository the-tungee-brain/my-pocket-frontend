"use client";

import { useCallback, useMemo, useState } from "react";
import { useWatchlistContext } from "@/app/contexts/WatchlistContext";
import { sortedFolders } from "@/lib/watchlistWorkspace";
import type { CustomTradePlanResponse } from "@/app/types/customTradePlan";
import type { MomentumBreakoutCheckResponse } from "@/app/types/momentumBreakoutCheck";
import { postCustomTradePlan } from "@/lib/customTradePlan";
import { fetchMomentumBreakoutCheck } from "@/lib/momentumBreakoutCheck";
import { postMomentumBreakoutTradePlanAlert } from "@/lib/momentumBreakoutAlerts";
import { formatUsdLevel } from "@/lib/momentumBreakoutAlertUi";
import { SymbolSearchField } from "@/components/SymbolSearchField";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  accessToken: string;
  trackedSymbols?: ReadonlySet<string>;
  onTrackPlan?: (symbol: string) => void;
  onAlertsChanged?: () => void;
  className?: string;
};

function resultPanelClass(status: MomentumBreakoutCheckResponse["status"]): string {
  switch (status) {
    case "TRADABLE_BREAKOUT":
      return "border-success/30 bg-success/8";
    case "REJECTED_BREAKOUT":
      return "border-warning/35 bg-warning-muted/40";
    case "NO_BREAKOUT_SETUP":
      return "border-border/80 bg-muted-bg/30";
    default:
      return "border-border/80 bg-muted-bg/25";
  }
}

export function MomentumBreakoutStockCheck({
  accessToken,
  trackedSymbols,
  onTrackPlan,
  onAlertsChanged,
  className,
}: Props) {
  const [symbolInput, setSymbolInput] = useState("");
  const [tracking, setTracking] = useState(false);
  const [customLoading, setCustomLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MomentumBreakoutCheckResponse | null>(null);
  const [customPlan, setCustomPlan] = useState<CustomTradePlanResponse | null>(null);
  const { symbols: watchlistSymbols, sortedFolderList } = useWatchlistContext();

  const watchlistSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const items: { symbol: string; title: string }[] = [];

    const hasFolderSymbols = sortedFolderList.some((f) => f.symbols.length > 0);
    if (hasFolderSymbols) {
      for (const folder of sortedFolders(sortedFolderList)) {
        for (const entry of folder.symbols) {
          const sym = entry.ticker;
          if (seen.has(sym)) continue;
          seen.add(sym);
          items.push({
            symbol: sym,
            title: entry.companyName?.trim() || sym,
          });
        }
      }
      return items;
    }

    for (const sym of watchlistSymbols) {
      if (seen.has(sym)) continue;
      seen.add(sym);
      items.push({ symbol: sym, title: sym });
    }
    return items;
  }, [sortedFolderList, watchlistSymbols]);

  const runCheck = useCallback(
    async (symbolOverride?: string) => {
      const sym = (symbolOverride ?? symbolInput).trim().toUpperCase();
      if (!sym) {
        setError("Search for a ticker or company name to check.");
        return;
      }
      setSymbolInput(sym);
      setError(null);
      setResult(null);
      setCustomPlan(null);
      try {
        const data = await fetchMomentumBreakoutCheck(accessToken, sym);
        setResult(data);
        setSymbolInput(data.symbol);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not check this symbol.",
        );
      }
    },
    [accessToken, symbolInput],
  );

  const handleTrack = useCallback(async () => {
    if (!result?.canTrackBreakoutPlan) return;
    const sym = result.symbol;
    setTracking(true);
    setError(null);
    try {
      const created = await postMomentumBreakoutTradePlanAlert(accessToken, sym);
      if (!created.planAvailable) {
        setError(
          "We could not save this educational plan to your watchlist. It may not pass current safety rules.",
        );
        return;
      }
      onAlertsChanged?.();
      onTrackPlan?.(sym);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not track this plan.",
      );
    } finally {
      setTracking(false);
    }
  }, [accessToken, onAlertsChanged, onTrackPlan, result]);

  const handleCustomPlan = useCallback(async () => {
    const sym = (result?.symbol ?? symbolInput).trim().toUpperCase();
    if (!sym) return;
    setCustomLoading(true);
    setError(null);
    try {
      const plan = await postCustomTradePlan(accessToken, sym);
      setCustomPlan(plan);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate a custom educational plan.",
      );
    } finally {
      setCustomLoading(false);
    }
  }, [accessToken, result?.symbol, symbolInput]);

  const alreadyTracked =
    result != null && trackedSymbols?.has(result.symbol.toUpperCase());

  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-surface/60 px-4 py-4",
        className,
      )}
      aria-label="Check any stock"
    >
      <h3 className="text-[15px] font-semibold text-foreground">
        Check any stock
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed text-foreground/75">
        After reviewing today&apos;s scan, search by symbol or company name to
        see whether a stock qualifies for a Momentum Breakout educational plan.
      </p>

      <SymbolSearchField
        className="mt-3"
        accessToken={accessToken}
        value={symbolInput}
        onChange={(next) => setSymbolInput(next.toUpperCase())}
        onSelect={(symbol) => void runCheck(symbol)}
        placeholder="Search symbol or company, e.g. Microsoft or MSFT"
        limit={8}
        clearOnSelect={false}
      />

      {watchlistSuggestions.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            From your watchlist
          </p>
          <ul
            className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border/80 bg-background/60 p-1"
            aria-label="Watchlist symbols to check"
          >
            {watchlistSuggestions.map((item) => (
              <li key={item.symbol}>
                <button
                  type="button"
                  onClick={() => void runCheck(item.symbol)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition hover:bg-muted-bg"
                >
                  <span className="font-mono font-semibold text-foreground">
                    {item.symbol}
                  </span>
                  {item.title !== item.symbol && (
                    <span className="min-w-0 truncate text-xs text-muted">
                      {item.title}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div
          className={cn(
            "mt-4 rounded-lg border px-4 py-3",
            resultPanelClass(result.status),
          )}
        >
          <h4 className="text-base font-semibold text-foreground">
            {result.verdictTitle}
          </h4>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">
            {result.verdictMessage}
          </p>

          {result.status === "REJECTED_BREAKOUT" &&
            result.rejectionReasons.length > 0 && (
              <ul className="mt-3 list-inside list-disc space-y-1 text-[13px] text-foreground/80">
                {result.rejectionReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}

          {result.status === "NO_BREAKOUT_SETUP" &&
            result.failedSetupRules.length > 0 && (
              <ul className="mt-3 list-inside list-disc space-y-1 text-[13px] text-foreground/80">
                {result.failedSetupRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            )}

          {result.entryPrice != null && result.stopPrice != null && (
            <p className="mt-3 text-[13px] text-foreground/75">
              Educational levels: entry {formatUsdLevel(result.entryPrice)} ·
              stop {formatUsdLevel(result.stopPrice)} · target{" "}
              {result.targetPrice != null
                ? formatUsdLevel(result.targetPrice)
                : "—"}
            </p>
          )}

          {result.status === "TRADABLE_BREAKOUT" && result.canTrackBreakoutPlan && (
            <Button
              type="button"
              variant={alreadyTracked ? "outline" : "default"}
              size="sm"
              className="mt-3 w-full sm:w-auto"
              isLoading={tracking}
              onClick={() => void handleTrack()}
            >
              {alreadyTracked
                ? "View on watchlist"
                : "Track this breakout plan"}
            </Button>
          )}

          {result.status === "REJECTED_BREAKOUT" &&
            result.canTrackBreakoutPlan && (
              <Button
                type="button"
                variant={alreadyTracked ? "outline" : "default"}
                size="sm"
                className="mt-3 w-full sm:w-auto"
                isLoading={tracking}
                onClick={() => void handleTrack()}
              >
                {alreadyTracked
                  ? "View on watchlist"
                  : "Track this breakout plan"}
              </Button>
            )}

          {result.status === "NO_BREAKOUT_SETUP" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full sm:w-auto"
              isLoading={customLoading}
              onClick={() => void handleCustomPlan()}
            >
              Generate custom educational plan
            </Button>
          )}
        </div>
      )}

      {customPlan && (
        <div className="mt-3 rounded-lg border border-border/80 bg-background/60 px-4 py-3">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-foreground/70">
            {customPlan.setupName} · not Momentum Breakout
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">
            {customPlan.entryExplanation}
          </p>
          <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
            <div>
              <dt className="text-foreground/70">Current price</dt>
              <dd className="font-semibold tabular-nums text-foreground">
                {formatUsdLevel(customPlan.currentPrice)}
              </dd>
              <dd className="text-foreground/60">
                As of {customPlan.latestBarDate}
              </dd>
            </div>
            <div>
              <dt className="text-foreground/70">Entry trigger</dt>
              <dd className="font-semibold tabular-nums text-foreground">
                {formatUsdLevel(customPlan.entryPrice)}
              </dd>
              {customPlan.distanceToEntryPct > 2 && (
                <dd className="text-foreground/75">
                  Distance: +{customPlan.distanceToEntryPct.toFixed(1)}%
                </dd>
              )}
            </div>
            <div>
              <dt className="text-foreground/70">Stop (educational)</dt>
              <dd className="font-semibold tabular-nums text-foreground">
                {formatUsdLevel(customPlan.stopPrice)}
              </dd>
            </div>
            <div>
              <dt className="text-foreground/70">Target (educational)</dt>
              <dd className="font-semibold tabular-nums text-foreground">
                {formatUsdLevel(customPlan.targetPrice)} (
                {customPlan.riskReward.toFixed(1)}R)
              </dd>
            </div>
          </dl>
          {!customPlan.planActiveAtCurrentPrice && (
            <p className="mt-3 rounded-md border border-warning/30 bg-warning-muted/40 px-3 py-2 text-[13px] leading-relaxed text-foreground/85">
              This plan is inactive until the entry trigger is reached. For
              learning only — we do not place trades.
            </p>
          )}
          {customPlan.planActiveAtCurrentPrice && (
            <p className="mt-3 text-[13px] text-foreground/75">
              For learning only — we do not place trades.
            </p>
          )}
          {customPlan.warnings.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] text-foreground/75">
              {customPlan.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
