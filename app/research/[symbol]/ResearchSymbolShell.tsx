"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { CompanySnapshot } from "./CompanySnapshot";
import { ResearchTabBar, researchTabLabel } from "@/components/ResearchTabBar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { addRecentSymbol } from "@/lib/recentSymbols";
import { useResearchSearchShortcut } from "@/app/hooks/useResearchSearchShortcut";
import { usePositionsContext } from "@/app/Providers";
import { symbolHubPath } from "@/lib/symbolRoutes";
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
  const { positionMap } = usePositionsContext();
  const { assetType } = useResearchAssetTypeContext();
  const [collapsed, setCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const symbolUpper = symbol.toUpperCase();
  const activeTab = pathname.split("/")[3] ?? "overview";
  const hasPosition = (positionMap[symbolUpper]?.length ?? 0) > 0;

  useResearchSearchShortcut();

  useEffect(() => {
    addRecentSymbol(symbol);
  }, [symbol]);

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
    <div className={cn(pageShellClass, "pb-2")}>
      <div
        ref={sentinelRef}
        className="pointer-events-none h-px"
        aria-hidden="true"
      />

      <div
        className={cn(
          "sticky top-0 z-20 -mx-4 bg-background/95 px-4 backdrop-blur-md transition-[padding] duration-200",
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
              { label: researchTabLabel(activeTab, assetType) },
            ]}
          />
        )}

        <div className={cn("space-y-3", collapsed && "space-y-2")}>
          <CompanySnapshot symbol={symbol} compact={collapsed} />
          <ResearchTabBar symbol={symbol} assetType={assetType} />
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
