"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, ListChecks, Loader2, RefreshCw } from "lucide-react";
import { useMomentumBreakoutAlerts } from "@/app/hooks/useMomentumBreakoutAlerts";
import { useMomentumBreakoutFeatureFlags } from "@/app/hooks/useMomentumBreakoutFeatureFlags";
import { useMomentumBreakoutScan } from "@/app/hooks/useMomentumBreakoutScan";
import { MomentumBreakoutInvestorBrief } from "@/components/momentum-breakout/MomentumBreakoutInvestorBrief";
import { MomentumBreakoutPageHeader } from "@/components/momentum-breakout/MomentumBreakoutPageHeader";
import { MomentumBreakoutStockCheck } from "@/components/momentum-breakout/MomentumBreakoutStockCheck";
import { MomentumBreakoutStructuredEmpty } from "@/components/momentum-breakout/MomentumBreakoutStructuredEmpty";
import { AlertCard } from "@/components/momentum-breakout/AlertCard";
import { MomentumBreakoutLaunchReadinessPanel } from "@/components/momentum-breakout/MomentumBreakoutLaunchReadinessPanel";
import { MomentumBreakoutPaperPerformanceTab } from "@/components/momentum-breakout/MomentumBreakoutPaperPerformanceTab";
import type { PaperTradeSummary } from "@/app/types/momentumBreakoutPaperPerformance";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonList } from "@/components/ui/Skeleton";
import { fetchMomentumBreakoutPaperSummary } from "@/lib/momentumBreakoutPaperPerformance";
import {
  MB_WATCHLIST_SECTION_ID,
  mbAlertElementId,
} from "@/lib/momentumBreakoutInvestorUi";
import {
  mbEyebrowClass,
  mbPageGridClass,
  mbPanelBodyClass,
  mbPanelBodyLgClass,
  mbPanelClass,
  mbPanelHeaderClass,
  mbScanColumnClass,
  mbWatchlistStickyClass,
} from "@/lib/momentumBreakoutUi";
import { appIconBoxClass, appStackClass, appTabBarClass, appTabLinkClass } from "@/lib/appUi";
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
      <MomentumBreakoutPageHeader />

      <div className={mbPageGridClass}>
        <div className={mbScanColumnClass}>
          <section className={mbPanelClass} aria-label="Today's market scan">
            <div className={mbPanelHeaderClass}>
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className={cn(appIconBoxClass, "h-8 w-8 shrink-0 text-accent-strong")}
                  aria-hidden
                >
                  <ListChecks className="h-4 w-4" />
                </div>
                <div>
                  <p className={mbEyebrowClass}>Scanner</p>
                  <h2 className="text-sm font-semibold text-foreground">
                    Today&apos;s market scan
                  </h2>
                </div>
              </div>
            </div>
            <div className={mbPanelBodyLgClass}>
              <MomentumBreakoutInvestorBrief
                scan={scanSummary}
                paperSummary={paperSummary}
                loading={scanLoading}
                error={scanError}
                trackedSymbols={trackedSymbols}
                onTrackPlan={handleTrackPlan}
              />
            </div>
          </section>

          <section className={mbPanelClass} aria-label="Check any stock">
            <div className={mbPanelHeaderClass}>
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className={cn(appIconBoxClass, "h-8 w-8 shrink-0 text-muted")}
                  aria-hidden
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <p className={mbEyebrowClass}>Manual check</p>
                  <h2 className="text-sm font-semibold text-foreground">
                    Check any stock
                  </h2>
                </div>
              </div>
            </div>
            <div className={mbPanelBodyClass}>
              <MomentumBreakoutStockCheck
                accessToken={accessToken}
                trackedSymbols={trackedSymbols}
                onTrackPlan={handleTrackPlan}
                onAlertsChanged={() => void reload()}
              />
            </div>
          </section>
        </div>

        <section
          id={MB_WATCHLIST_SECTION_ID}
          className={cn(
            mbPanelClass,
            mbWatchlistStickyClass,
            "scroll-mt-20 transition-shadow duration-500",
            watchlistHighlight &&
              "ring-2 ring-accent/45 ring-offset-2 ring-offset-background",
          )}
          aria-label="Your alert watchlist"
        >
          <div className={cn(mbPanelHeaderClass, "flex-wrap gap-3")}>
            <div className="min-w-0 flex-1">
              <p className={mbEyebrowClass}>Price alerts</p>
              <h2 className="text-sm font-semibold text-foreground">
                Your plan watchlist
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Educational tracking only — not your research watchlist folders.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
              {watchlistPricesLabel && (
                <span className="text-xs tabular-nums text-muted">
                  Updated {watchlistPricesLabel}
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
          </div>

          <div className={cn(mbPanelBodyClass, "space-y-4")}>
            <MomentumBreakoutLaunchReadinessPanel accessToken={accessToken} />

            {disclaimer && (
              <p className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs leading-relaxed text-muted">
                {disclaimer}
              </p>
            )}

            <div className={appTabBarClass} role="tablist" aria-label="Watchlist views">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "active"}
                className={appTabLinkClass(tab === "active")}
                onClick={() => setTab("active")}
              >
                Active ({activeAlerts.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "history"}
                className={appTabLinkClass(tab === "history")}
                onClick={() => setTab("history")}
              >
                Completed ({historyAlerts.length})
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
              <div className="rounded-lg border border-warning/25 bg-warning-muted/40 px-3 py-2 text-xs text-foreground">
                <p className="font-semibold">Refresh notes</p>
                <ul className="mt-1 list-inside list-disc text-muted">
                  {refreshWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <ErrorBanner message={error} onRetry={() => void reload()} />
            )}

            {tab === "performance" && flags.paperAnalyticsEnabled && (
              <MomentumBreakoutPaperPerformanceTab accessToken={accessToken} />
            )}

            {tab !== "performance" && loading && displayed.length === 0 && !error && (
              <SkeletonList rows={3} rowClassName="h-24 rounded-xl" />
            )}

            {tab !== "performance" && !loading && !error && displayed.length === 0 && (
              tab === "active" ? (
                <MomentumBreakoutStructuredEmpty
                  icon={Bell}
                  title="No active alerts"
                  happened="You do not have any breakout plans being monitored."
                  doing="We continue scanning during market hours."
                  expect="Saved plans appear here when you track an approved setup."
                />
              ) : (
                <MomentumBreakoutStructuredEmpty
                  icon={Bell}
                  title="No completed alerts"
                  happened="None of your tracked plans have finished yet."
                  doing="We monitor entry, stop, and target levels on active plans."
                  expect="Completed plans show here after target, stop, or expiry."
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
              <div className="space-y-3">
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
              <p className="text-[11px] leading-relaxed text-muted">
                Auto-refresh every 60s. Use Refresh for an immediate price pull.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
