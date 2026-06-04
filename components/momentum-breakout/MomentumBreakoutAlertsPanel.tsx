"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Loader2, RefreshCw } from "lucide-react";
import { useMomentumBreakoutAlerts } from "@/app/hooks/useMomentumBreakoutAlerts";
import { useMomentumBreakoutFeatureFlags } from "@/app/hooks/useMomentumBreakoutFeatureFlags";
import { useMomentumBreakoutScan } from "@/app/hooks/useMomentumBreakoutScan";
import { MomentumBreakoutInvestorBrief } from "@/components/momentum-breakout/MomentumBreakoutInvestorBrief";
import { MomentumBreakoutStockCheck } from "@/components/momentum-breakout/MomentumBreakoutStockCheck";
import { MomentumBreakoutStructuredEmpty } from "@/components/momentum-breakout/MomentumBreakoutStructuredEmpty";
import { AlertCard } from "@/components/momentum-breakout/AlertCard";
import { MomentumBreakoutLaunchReadinessPanel } from "@/components/momentum-breakout/MomentumBreakoutLaunchReadinessPanel";
import { MomentumBreakoutPaperPerformanceTab } from "@/components/momentum-breakout/MomentumBreakoutPaperPerformanceTab";
import type { PaperTradeSummary } from "@/app/types/momentumBreakoutPaperPerformance";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonList } from "@/components/ui/Skeleton";
import { fetchMomentumBreakoutPaperSummary } from "@/lib/momentumBreakoutPaperPerformance";
import {
  MB_WATCHLIST_SECTION_ID,
  mbAlertElementId,
} from "@/lib/momentumBreakoutInvestorUi";
import { appStackClass, appTabBarClass, appTabLinkClass } from "@/lib/appUi";
import { pageSectionClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

type Tab = "active" | "history" | "performance";

type Props = {
  accessToken: string;
  className?: string;
};

export function MomentumBreakoutAlertsPanel({ accessToken, className }: Props) {
  const { flags } = useMomentumBreakoutFeatureFlags(accessToken);
  const [tab, setTab] = useState<Tab>("active");
  const {
    activeAlerts,
    historyAlerts,
    disclaimer,
    loading,
    refreshing,
    error,
    lastUpdated,
    refreshWarnings,
    reload,
    manualRefresh,
    cancelAlert,
    cancellingAlertId,
  } = useMomentumBreakoutAlerts(accessToken);
  const {
    scan: scanSummary,
    loading: scanLoading,
    error: scanError,
  } = useMomentumBreakoutScan(accessToken, { tradableOnly: false });

  const [paperSummary, setPaperSummary] = useState<PaperTradeSummary | null>(null);
  const [watchlistHighlight, setWatchlistHighlight] = useState(false);

  useEffect(() => {
    if (!accessToken || !flags.paperAnalyticsEnabled) {
      setPaperSummary(null);
      return;
    }
    let cancelled = false;
    void fetchMomentumBreakoutPaperSummary(accessToken)
      .then((res) => {
        if (!cancelled) setPaperSummary(res.summary);
      })
      .catch(() => {
        if (!cancelled) setPaperSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, flags.paperAnalyticsEnabled]);

  const displayed = tab === "active" ? activeAlerts : historyAlerts;

  const watchlistPricesLabel = useMemo(() => {
    if (!lastUpdated) return null;
    return new Date(lastUpdated).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [lastUpdated]);

  const trackedSymbols = useMemo(
    () => new Set(activeAlerts.map((a) => a.symbol.toUpperCase())),
    [activeAlerts],
  );

  const handleTrackPlan = useCallback((symbol: string) => {
    setTab("active");
    const upper = symbol.toUpperCase();
    const target =
      document.getElementById(mbAlertElementId(upper)) ??
      document.getElementById(MB_WATCHLIST_SECTION_ID);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    setWatchlistHighlight(true);
    window.setTimeout(() => setWatchlistHighlight(false), 2600);
  }, []);

  return (
    <div className={cn(appStackClass, pageSectionClass, className)}>
      <MomentumBreakoutInvestorBrief
        scan={scanSummary}
        paperSummary={paperSummary}
        loading={scanLoading}
        error={scanError}
        trackedSymbols={trackedSymbols}
        onTrackPlan={handleTrackPlan}
      />

      <MomentumBreakoutStockCheck
        accessToken={accessToken}
        trackedSymbols={trackedSymbols}
        onTrackPlan={handleTrackPlan}
        onAlertsChanged={() => void reload()}
      />

      <Card
        id={MB_WATCHLIST_SECTION_ID}
        className={cn(
          "scroll-mt-20 transition-shadow duration-500",
          watchlistHighlight &&
            "ring-2 ring-accent/50 ring-offset-2 ring-offset-background",
        )}
      >
        <CardHeader>
          <CardTitle
            title="Your watchlist"
            description="Educational price tracking only — we do not place trades for you."
          />
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {watchlistPricesLabel && (
              <span className="text-[13px] text-foreground/75">
                Watchlist prices: {watchlistPricesLabel}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="xs"
              isLoading={refreshing}
              onClick={() => void manualRefresh()}
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardBody className="space-y-4">
          <MomentumBreakoutLaunchReadinessPanel accessToken={accessToken} />
          {disclaimer && (
            <p className="text-xs leading-relaxed text-muted">{disclaimer}</p>
          )}

          <div className={appTabBarClass} role="tablist" aria-label="Watchlist views">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "active"}
              className={appTabLinkClass(tab === "active")}
              onClick={() => setTab("active")}
            >
              Active Alerts ({activeAlerts.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "history"}
              className={appTabLinkClass(tab === "history")}
              onClick={() => setTab("history")}
            >
              Completed Alerts ({historyAlerts.length})
            </button>
            {flags.paperAnalyticsEnabled && (
              <button
                type="button"
                role="tab"
                aria-selected={tab === "performance"}
                className={appTabLinkClass(tab === "performance")}
                onClick={() => setTab("performance")}
              >
                Performance
              </button>
            )}
          </div>

          {refreshWarnings.length > 0 && (
            <div className="rounded-lg border border-warning/25 bg-warning-muted px-3 py-2 text-xs text-foreground">
              <p className="font-semibold">Refresh notes</p>
              <ul className="mt-1 list-inside list-disc text-muted">
                {refreshWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <ErrorBanner
              message={error}
              onRetry={() => void reload()}
            />
          )}

          {tab === "performance" && flags.paperAnalyticsEnabled && (
            <MomentumBreakoutPaperPerformanceTab accessToken={accessToken} />
          )}

          {tab !== "performance" && loading && displayed.length === 0 && !error && (
            <SkeletonList rows={3} />
          )}

          {tab !== "performance" && !loading && !error && displayed.length === 0 && (
            tab === "active" ? (
              <MomentumBreakoutStructuredEmpty
                icon={Bell}
                title="No Active Alerts"
                happened="You do not currently have any breakout plans being monitored."
                doing="We continue scanning the market during trading hours."
                expect="When a qualified opportunity is saved, it will appear here automatically."
              />
            ) : (
              <MomentumBreakoutStructuredEmpty
                icon={Bell}
                title="No Completed Alerts"
                happened="None of your tracked plans have completed yet."
                doing="We keep monitoring active plans for entry, stop, and target prices."
                expect="Completed plans appear here when they hit a target, stop, or expiry date."
              />
            )
          )}

          {tab !== "performance" && refreshing && displayed.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Refreshing prices…
            </div>
          )}

          {tab !== "performance" && (
            <div className={appStackClass}>
              {displayed.map((alert) => (
                <AlertCard
                  key={alert.alertId ?? `${alert.symbol}-${alert.createdAt}`}
                  alert={alert}
                  showCancel={tab === "active"}
                  onCancel={(alertId) => void cancelAlert(alertId)}
                  cancelLoading={cancellingAlertId === alert.alertId}
                />
              ))}
            </div>
          )}

          {tab !== "performance" && (
            <p className="text-[10px] leading-relaxed text-muted">
              Active alerts auto-refresh every 60 seconds. Use Refresh to pull the
              latest prices immediately.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
