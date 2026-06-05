"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import { CompanySnapshot } from "./CompanySnapshot";
import { StrategySymbolPlaybookStrip } from "@/components/StrategySymbolPlaybookStrip";
import { ResearchTabBar, researchBreadcrumbLabel } from "@/components/ResearchTabBar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { track } from "@/lib/analytics";
import { addRecentSymbol } from "@/lib/recentSymbols";
import { useResearchSearchShortcut } from "@/app/hooks/useResearchSearchShortcut";
import { useSymbolIntelligence } from "@/app/hooks/useSymbolIntelligence";
import { usePortfolioContext } from "@/app/contextSelectors";
import { useStrategyContext } from "@/app/contexts/StrategyContext";
import { symbolHubPath } from "@/lib/symbolRoutes";
import {
  shouldShowOptionsTab,
  symbolHasOptionPositions,
} from "@/lib/symbolOptions";
import { appStackClass, appStackSmClass } from "@/lib/appUi";
import { pageShellClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import { ResearchOverviewProvider } from "@/app/research/ResearchOverviewContext";
import { ResearchDataAsOfLabel } from "@/app/research/ResearchDataAsOfLabel";
import { TickerKeyStats } from "@/components/TickerKeyStats";
import {
  ResearchAssetTypeProvider,
  useResearchAssetTypeContext,
} from "./ResearchAssetTypeContext";
import { ResearchSymbolHeaderProvider } from "./ResearchSymbolHeaderContext";
import { ResearchSymbolIntelligenceProvider } from "./ResearchSymbolIntelligenceContext";
import { TradeDecisionPanel } from "@/components/TradeDecisionPanel";
import { pageSectionClass } from "@/lib/pageLayout";

type Props = {
  symbol: string;
  children: React.ReactNode;
};

function ResearchSymbolShellInner({ symbol, children }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { positionMap } = usePortfolioContext();
  const { profile } = useStrategyContext();
  const { assetType, isEtf } = useResearchAssetTypeContext();
  const [scrollCollapsed, setScrollCollapsed] = useState(false);
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const collapsed = scrollCollapsed && !headerExpanded;
  const symbolUpper = symbol.toUpperCase();
  const activeTab = pathname.split("/")[3] ?? "overview";
  const hasPosition = (positionMap[symbolUpper]?.length ?? 0) > 0;
  const userPositions = positionMap[symbolUpper];
  const includeOptions =
    activeTab === "overview" ||
    activeTab === "options" ||
    symbolHasOptionPositions(userPositions);
  const symbolIntelligence = useSymbolIntelligence(symbol, {
    accessToken,
    includeOptions,
  });
  const showOptionsTab = shouldShowOptionsTab(
    userPositions,
    symbolIntelligence.intelligence,
    activeTab,
  );
  const showWheelBacktestTab = profile?.primaryStrategy === "wheel";

  useResearchSearchShortcut();

  useEffect(() => {
    addRecentSymbol(symbol);
    track("research_symbol_opened", {
      symbol: symbolUpper,
      tab: activeTab,
      has_position: hasPosition,
    });
  }, [symbol, symbolUpper, activeTab, hasPosition]);

  useEffect(() => {
    void pathname;
    const root = document.getElementById("main-content");
    root?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    const root = document.getElementById("main-content");
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrollCollapsed(!entry.isIntersecting),
      { root, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollCollapsed) {
      setHeaderExpanded(false);
    }
  }, [scrollCollapsed]);

  return (
    <ResearchSymbolIntelligenceProvider
      intelligence={symbolIntelligence.intelligence}
      loading={symbolIntelligence.loading}
      error={symbolIntelligence.error}
      refetch={symbolIntelligence.refetch}
      includeOptions={includeOptions}
    >
      <div className={cn(pageShellClass, "min-w-0 pb-2")}>
      <div
        ref={sentinelRef}
        className="pointer-events-none h-px"
        aria-hidden="true"
      />

      <div
        className={cn(
          "sticky top-0 z-20 transition-[padding] duration-200",
          scrollCollapsed &&
            "border-b border-[var(--app-border-subtle)] bg-background/80 backdrop-blur-sm",
          collapsed ? "pb-2 pt-1.5" : "pb-3 pt-2",
        )}
      >
        {!collapsed && (
          <Breadcrumbs
            className="mb-3"
            items={[
              ...(hasPosition
                ? [{ label: "Portfolio", href: "/portfolio" }]
                : []),
              { label: "Research", href: "/research" },
              { label: symbolUpper, href: symbolHubPath(symbolUpper, "overview") },
              { label: researchBreadcrumbLabel(activeTab) },
            ]}
          />
        )}

        <div className={cn(appStackSmClass, collapsed && "gap-2")}>
          <CompanySnapshot symbol={symbol} compact={collapsed} />
          {!collapsed && <StrategySymbolPlaybookStrip symbol={symbol} />}
          <ResearchTabBar
            symbol={symbol}
            assetType={assetType}
            isEtf={isEtf}
            showOptionsTab={showOptionsTab}
            showWheelBacktestTab={showWheelBacktestTab}
          />
          {!collapsed ? <TickerKeyStats symbol={symbol} /> : null}
          {scrollCollapsed ? (
            <button
              type="button"
              aria-expanded={headerExpanded}
              onClick={() => setHeaderExpanded((current) => !current)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/80 bg-secondary/50 px-3 py-2 text-left md:hidden"
            >
              <span className="text-xs font-medium text-foreground">
                {headerExpanded ? "Hide symbol details" : "Show symbol details"}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted transition-transform",
                  headerExpanded && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          ) : null}
        </div>
      </div>

      <div
        id={`research-tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`research-tab-${activeTab}`}
        className={cn("mt-8", appStackClass)}
      >
        {activeTab !== "overview" ? (
          <ResearchDataAsOfLabel className="-mt-4 mb-1" />
        ) : null}
        {!isEtf && activeTab === "overview" ? (
          <TradeDecisionPanel
            symbol={symbol}
            accessToken={accessToken}
            className={pageSectionClass}
          />
        ) : null}
        {children}
      </div>
      </div>
    </ResearchSymbolIntelligenceProvider>
  );
}

export function ResearchSymbolShell({ symbol, children }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  const inner = (
    <ResearchAssetTypeProvider symbol={symbol} accessToken={accessToken}>
      <ResearchSymbolHeaderProvider symbol={symbol} accessToken={accessToken}>
        <ResearchSymbolShellInner symbol={symbol}>{children}</ResearchSymbolShellInner>
      </ResearchSymbolHeaderProvider>
    </ResearchAssetTypeProvider>
  );

  if (!accessToken) {
    return inner;
  }

  return (
    <ResearchOverviewProvider symbol={symbol} accessToken={accessToken}>
      {inner}
    </ResearchOverviewProvider>
  );
}
