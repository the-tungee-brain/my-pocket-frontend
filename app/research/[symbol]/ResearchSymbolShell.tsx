"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { CompanySnapshot } from "./CompanySnapshot";
import { StrategySymbolPlaybookStrip } from "@/components/StrategySymbolPlaybookStrip";
import { ResearchTabBar, researchBreadcrumbLabel } from "@/components/ResearchTabBar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { track } from "@/lib/analytics";
import { addRecentSymbol } from "@/lib/recentSymbols";
import { useResearchSearchShortcut } from "@/app/hooks/useResearchSearchShortcut";
import { useSymbolIntelligence } from "@/app/hooks/useSymbolIntelligence";
import { usePositionsContext } from "@/app/Providers";
import { useStrategyContext } from "@/app/contexts/StrategyContext";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { shouldShowOptionsTab } from "@/lib/symbolOptions";
import { pageShellClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import {
  ResearchAssetTypeProvider,
  useResearchAssetTypeContext,
} from "./ResearchAssetTypeContext";

type Props = {
  symbol: string;
  children: React.ReactNode;
};

function ResearchSymbolShellInner({ symbol, children }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { positionMap } = usePositionsContext();
  const { profile } = useStrategyContext();
  const { assetType, isEtf } = useResearchAssetTypeContext();
  const [collapsed, setCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const symbolUpper = symbol.toUpperCase();
  const activeTab = pathname.split("/")[3] ?? "overview";
  const hasPosition = (positionMap[symbolUpper]?.length ?? 0) > 0;
  const { intelligence } = useSymbolIntelligence(symbol, { accessToken });
  const showOptionsTab = shouldShowOptionsTab(
    positionMap[symbolUpper],
    intelligence,
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
    const root = document.getElementById("main-content");
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { root, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn(pageShellClass, "min-w-0 pb-2")}>
      <div
        ref={sentinelRef}
        className="pointer-events-none h-px"
        aria-hidden="true"
      />

      <div
        className={cn(
          "sticky top-0 z-20 bg-background/95 backdrop-blur-md transition-[padding] duration-200",
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

        <div className={cn("space-y-3", collapsed && "space-y-2")}>
          <CompanySnapshot symbol={symbol} compact={collapsed} />
          {!collapsed && <StrategySymbolPlaybookStrip symbol={symbol} />}
          <ResearchTabBar
            symbol={symbol}
            assetType={assetType}
            isEtf={isEtf}
            showOptionsTab={showOptionsTab}
            showWheelBacktestTab={showWheelBacktestTab}
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

export function ResearchSymbolShell({ symbol, children }: Props) {
  const { data: session } = useSession();

  return (
    <ResearchAssetTypeProvider
      symbol={symbol}
      accessToken={session?.accessToken}
    >
      <ResearchSymbolShellInner symbol={symbol}>{children}</ResearchSymbolShellInner>
    </ResearchAssetTypeProvider>
  );
}
