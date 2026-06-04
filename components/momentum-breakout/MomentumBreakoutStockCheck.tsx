"use client";

import { useCallback, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useWatchlistContext } from "@/app/contexts/WatchlistContext";
import { sortedFolders } from "@/lib/watchlistWorkspace";
import type { CustomTradePlanResponse } from "@/app/types/customTradePlan";
import type { MomentumBreakoutCheckResponse } from "@/app/types/momentumBreakoutCheck";
import { postCustomTradePlan } from "@/lib/customTradePlan";
import { fetchMomentumBreakoutCheck } from "@/lib/momentumBreakoutCheck";
import { postMomentumBreakoutTradePlanAlert } from "@/lib/momentumBreakoutAlerts";
import { formatUsdLevel } from "@/lib/momentumBreakoutAlertUi";
import {
  mbChipClass,
  mbInsetListClass,
  mbOpportunityCardClass,
  mbSectionLabelClass,
  mbStatusPillClass,
} from "@/lib/momentumBreakoutUi";
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

function resultAccentClass(status: MomentumBreakoutCheckResponse["status"]): string {
  switch (status) {
    case "TRADABLE_BREAKOUT":
      return "border-l-success/60 bg-success/[0.04]";
    case "REJECTED_BREAKOUT":
      return "border-l-warning/60 bg-warning-muted/25";
    case "NO_BREAKOUT_SETUP":
      return "border-l-border bg-muted-bg/20";
    default:
      return "border-l-border bg-muted-bg/15";
  }
}

function resultPillKind(
  status: MomentumBreakoutCheckResponse["status"],
): "approved" | "caution" | "rejected" | "neutral" {
  switch (status) {
    case "TRADABLE_BREAKOUT":
      return "approved";
    case "REJECTED_BREAKOUT":
      return "caution";
    case "NO_BREAKOUT_SETUP":
      return "neutral";
    default:
      return "rejected";
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
          "We could not save this educational plan. It may not pass current safety rules.",
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
    <div className={cn("space-y-4", className)} aria-label="Check any stock">
      <p className="text-sm text-muted">
        Search any symbol after reviewing the scan, or pick one from your
        research watchlist.
      </p>

      <SymbolSearchField
        accessToken={accessToken}
        value={symbolInput}
        onChange={(next) => setSymbolInput(next.toUpperCase())}
        onSelect={(symbol) => void runCheck(symbol)}
        placeholder="Symbol or company name"
        limit={8}
        clearOnSelect={false}
      />

      {watchlistSuggestions.length > 0 && (
        <div>
          <p className={mbSectionLabelClass}>From your watchlist</p>
          <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
            {watchlistSuggestions.map((item) => (
              <button
                key={item.symbol}
                type="button"
                className={mbChipClass}
                onClick={() => void runCheck(item.symbol)}
                title={item.title !== item.symbol ? item.title : undefined}
              >
                <Search className="h-3 w-3 text-muted" aria-hidden />
                {item.symbol}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div
          className={cn(
            "rounded-xl border border-border/70 border-l-4 px-4 py-4",
            resultAccentClass(result.status),
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">
              {result.symbol}
            </span>
            <span className={mbStatusPillClass(resultPillKind(result.status))}>
              {result.status.replace(/_/g, " ").toLowerCase()}
            </span>
          </div>
          <h4 className="mt-2 text-base font-semibold text-foreground">
            {result.verdictTitle}
          </h4>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {result.verdictMessage}
          </p>

          {result.status === "REJECTED_BREAKOUT" &&
            result.rejectionReasons.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-foreground/85">
                {result.rejectionReasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <span className="text-muted">·</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            )}

          {result.status === "NO_BREAKOUT_SETUP" &&
            result.failedSetupRules.length > 0 && (
              <ul className={cn("mt-3", mbInsetListClass)}>
                {result.failedSetupRules.map((rule) => (
                  <li key={rule} className="px-3 py-2 text-sm text-muted">
                    {rule}
                  </li>
                ))}
              </ul>
            )}

          {result.entryPrice != null && result.stopPrice != null && (
            <p className="mt-3 text-xs text-muted">
              Entry {formatUsdLevel(result.entryPrice)} · Stop{" "}
              {formatUsdLevel(result.stopPrice)} · Target{" "}
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
              className="mt-4 w-full"
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
                className="mt-4 w-full"
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
              className="mt-4 w-full"
              isLoading={customLoading}
              onClick={() => void handleCustomPlan()}
            >
              Generate custom educational plan
            </Button>
          )}
        </div>
      )}

      {customPlan && (
        <div className={cn(mbOpportunityCardClass, "space-y-3")}>
          <p className={mbSectionLabelClass}>
            {customPlan.setupName} · not momentum breakout
          </p>
          <p className="text-sm leading-relaxed text-muted">
            {customPlan.entryExplanation}
          </p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
              <dt className="text-xs text-muted">Current price</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {formatUsdLevel(customPlan.currentPrice)}
              </dd>
              <dd className="text-[11px] text-muted">As of {customPlan.latestBarDate}</dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
              <dt className="text-xs text-muted">Entry trigger</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {formatUsdLevel(customPlan.entryPrice)}
              </dd>
              {customPlan.distanceToEntryPct > 2 && (
                <dd className="text-[11px] text-muted">
                  +{customPlan.distanceToEntryPct.toFixed(1)}% away
                </dd>
              )}
            </div>
            <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
              <dt className="text-xs text-muted">Stop</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {formatUsdLevel(customPlan.stopPrice)}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
              <dt className="text-xs text-muted">Target</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {formatUsdLevel(customPlan.targetPrice)} (
                {customPlan.riskReward.toFixed(1)}R)
              </dd>
            </div>
          </dl>
          {!customPlan.planActiveAtCurrentPrice && (
            <p className="rounded-lg border border-warning/25 bg-warning-muted/30 px-3 py-2 text-sm text-foreground/90">
              Inactive until the entry trigger is reached. Educational only.
            </p>
          )}
          {customPlan.warnings.length > 0 && (
            <ul className="space-y-1 text-sm text-muted">
              {customPlan.warnings.map((warning) => (
                <li key={warning}>· {warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
