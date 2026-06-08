"use client";

import { useCallback, useMemo, useState } from "react";
import { Bell, Clock, Loader2, RefreshCw } from "lucide-react";
import { useMomentumBreakoutAlerts } from "@/app/hooks/useMomentumBreakoutAlerts";
import { useMomentumBreakoutScan } from "@/app/hooks/useMomentumBreakoutScan";
import { MomentumBreakoutInvestorBrief } from "@/components/momentum-breakout/MomentumBreakoutInvestorBrief";
import { MomentumBreakoutPageHeader } from "@/components/momentum-breakout/MomentumBreakoutPageHeader";
import { MomentumBreakoutStockCheck } from "@/components/momentum-breakout/MomentumBreakoutStockCheck";
import { MomentumBreakoutStructuredEmpty } from "@/components/momentum-breakout/MomentumBreakoutStructuredEmpty";
import { AlertCard } from "@/components/momentum-breakout/AlertCard";
import { MomentumBreakoutLaunchReadinessPanel } from "@/components/momentum-breakout/MomentumBreakoutLaunchReadinessPanel";
import { MomentumBreakoutPaperPerformanceTab } from "@/components/momentum-breakout/MomentumBreakoutPaperPerformanceTab";
import type { MomentumBreakoutFeatureFlags } from "@/app/types/momentumBreakoutFeatureFlags";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonList } from "@/components/ui/Skeleton";
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
import { appStackClass, appTabBarClass, appTabLinkClass } from "@/lib/appUi";
import { pageSectionClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import type { MomentumBreakoutDevFixture } from "@/lib/momentumBreakoutDevFixtures";

type Tab = "active" | "history" | "performance";

type Props = {
  accessToken: string;
  flags: MomentumBreakoutFeatureFlags;
  className?: string;
  fixture?: MomentumBreakoutDevFixture | null;
};

export function MomentumBreakoutAlertsPanel({
  accessToken,
  flags,
  className,
  fixture = null,
}: Props) {
  const [tab, setTab] = useState<Tab>("active");
  const {
    activeAlerts: liveActiveAlerts,
    historyAlerts: liveHistoryAlerts,
    disclaimer: liveDisclaimer,
    loading: liveLoading,
    refreshing: liveRefreshing,
    error: liveError,
    lastUpdated: liveLastUpdated,
    refreshWarnings: liveRefreshWarnings,
    reload,
    manualRefresh,
    cancelAlert,
    cancellingAlertId,
  } = useMomentumBreakoutAlerts(accessToken, {
    includeHistory: tab === "history",
    enabled: !fixture,
  });
  const {
    scan: liveScanSummary,
    loading: liveScanLoading,
    error: liveScanError,
  } = useMomentumBreakoutScan(accessToken, {
    tradableOnly: false,
    enabled: !fixture,
  });

  const [watchlistHighlight, setWatchlistHighlight] = useState(false);

  const activeAlerts = fixture?.activeAlerts ?? liveActiveAlerts;
  const historyAlerts = fixture?.historyAlerts ?? liveHistoryAlerts;
  const disclaimer = fixture?.disclaimer ?? liveDisclaimer;
  const loading = fixture?.alertsLoading ?? liveLoading;
  const refreshing = fixture ? false : liveRefreshing;
  const error = fixture?.alertsError ?? liveError;
  const lastUpdated = fixture?.lastUpdated ?? liveLastUpdated;
  const refreshWarnings = fixture?.refreshWarnings ?? liveRefreshWarnings;
  const scanSummary = fixture?.scan ?? liveScanSummary;
  const scanLoading = fixture?.scanLoading ?? liveScanLoading;
  const scanError = fixture?.scanError ?? liveScanError;
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
          <section className={mbPanelClass} aria-label="Momentum Breakout overview">
            <div className={mbPanelBodyLgClass}>
              <MomentumBreakoutInvestorBrief
                scan={scanSummary}
                loading={scanLoading}
                error={scanError}
                trackedSymbols={trackedSymbols}
                onTrackPlan={handleTrackPlan}
              />
            </div>
          </section>

          <section className={mbPanelClass} aria-label="Trade setup check">
            <div className={mbPanelHeaderClass}>
              <div className="min-w-0">
                <p className={mbEyebrowClass}>Trade setup</p>
                <h2 className="text-sm font-semibold text-foreground">
                  Check any stock
                </h2>
              </div>
            </div>
            <div className={mbPanelBodyClass}>
              <MomentumBreakoutStockCheck
                accessToken={accessToken}
                trackedSymbols={trackedSymbols}
                onTrackPlan={handleTrackPlan}
                onAlertsChanged={() => void reload()}
                fixtureResult={fixture?.manualResult ?? null}
                fixtureError={fixture?.manualError ?? null}
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
          <div
            className={cn(mbPanelHeaderClass, "flex-wrap gap-3")}
            style={{ borderBottom: 0 }}
          >
            <div className="min-w-0 flex-1">
              <p className={mbEyebrowClass}>Risk / validation</p>
              <h2 className="text-sm font-semibold text-foreground">
                Trade plans
              </h2>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {watchlistPricesLabel && (
                <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-muted">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {watchlistPricesLabel}
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
              <p className="border-t border-border/60 pt-3 text-xs leading-relaxed text-muted">
                {disclaimer}
              </p>
            )}

            <div
              className={appTabBarClass}
              role="tablist"
              aria-label="Trade plan views"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "active"}
                className={appTabLinkClass(tab === "active")}
                onClick={() => setTab("active")}
              >
                Active
                <span className="ml-1 text-muted">({activeAlerts.length})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "history"}
                className={appTabLinkClass(tab === "history")}
                onClick={() => setTab("history")}
              >
                Completed
                <span className="ml-1 text-muted">
                  ({historyAlerts.length})
                </span>
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
              <div className="bg-warning-muted/30 px-3 py-2 text-xs text-foreground">
                <p className="font-semibold">Refresh notes</p>
                <ul className="mt-1 space-y-1 text-muted">
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

            {tab !== "performance" &&
              loading &&
              displayed.length === 0 &&
              !error && (
                <SkeletonList rows={3} rowClassName="h-24" />
              )}

            {tab !== "performance" &&
              !loading &&
              !error &&
              displayed.length === 0 &&
              (tab === "active" ? (
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
              ))}

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
          </div>
        </section>
      </div>
    </div>
  );
}
