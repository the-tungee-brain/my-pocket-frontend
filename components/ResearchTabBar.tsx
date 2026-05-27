"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  FileSpreadsheet,
  LayoutDashboard,
  Layers,
  LineChart,
  Newspaper,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetType } from "@/app/types/research";

export type ResearchTabId =
  | "overview"
  | "position"
  | "news"
  | "holdings"
  | "dividends"
  | "business"
  | "earnings"
  | "fundamentals"
  | "financials";

type Tab = {
  id: ResearchTabId;
  label: string;
  icon: LucideIcon;
  assetTypes?: AssetType[] | "all";
};

const allTabs: Tab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, assetTypes: "all" },
  { id: "position", label: "Position", icon: BriefcaseBusiness, assetTypes: "all" },
  { id: "news", label: "News", icon: Newspaper, assetTypes: "all" },
  {
    id: "holdings",
    label: "Composition",
    icon: Layers,
    assetTypes: ["ETF"],
  },
  {
    id: "dividends",
    label: "Dividends",
    icon: CircleDollarSign,
    assetTypes: ["STOCK", "ADR", "ETF"],
  },
  {
    id: "business",
    label: "Business",
    icon: BriefcaseBusiness,
    assetTypes: ["STOCK", "ADR"],
  },
  {
    id: "earnings",
    label: "Earnings",
    icon: TrendingUp,
    assetTypes: ["STOCK", "ADR"],
  },
  {
    id: "fundamentals",
    label: "Fundamentals",
    icon: FileSpreadsheet,
    assetTypes: ["STOCK", "ADR"],
  },
  {
    id: "fundamentals",
    label: "Fund metrics",
    icon: FileSpreadsheet,
    assetTypes: ["ETF"],
  },
  {
    id: "financials",
    label: "Financials",
    icon: LineChart,
    assetTypes: ["STOCK", "ADR"],
  },
];

function tabsForAssetType(
  assetType: AssetType | null | undefined,
  isEtf = false,
): Tab[] {
  const resolved: AssetType = isEtf ? "ETF" : assetType ?? "STOCK";
  const matched = allTabs.filter((tab) => {
    if (tab.assetTypes === "all") return true;
    return tab.assetTypes?.includes(resolved);
  });

  const seen = new Set<ResearchTabId>();
  return matched.filter((tab) => {
    if (seen.has(tab.id)) return false;
    seen.add(tab.id);
    return true;
  });
}

type ResearchTabBarProps = {
  symbol: string;
  assetType?: AssetType | null;
  isEtf?: boolean;
  className?: string;
};

export function ResearchTabBar({
  symbol,
  assetType,
  isEtf = false,
  className,
}: ResearchTabBarProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [showRightFade, setShowRightFade] = useState(false);
  const encoded = encodeURIComponent(symbol.toUpperCase());
  const activeTab =
    (pathname.split("/")[3] as ResearchTabId | undefined) ?? "overview";
  const tabs = tabsForAssetType(assetType, isEtf);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateFade = () => {
      const hasOverflow = nav.scrollWidth > nav.clientWidth + 1;
      const atEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 1;
      setShowRightFade(hasOverflow && !atEnd);
    };

    updateFade();
    nav.addEventListener("scroll", updateFade, { passive: true });
    const observer = new ResizeObserver(updateFade);
    observer.observe(nav);

    return () => {
      nav.removeEventListener("scroll", updateFade);
      observer.disconnect();
    };
  }, [symbol, assetType, isEtf]);

  return (
    <div className={cn("relative", className)}>
      <nav
        ref={navRef}
        className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted-bg/50 p-0.5 scrollbar-dark"
        aria-label="Research sections"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={`/research/${encoded}/${tab.id}`}
              className={cn(
                "relative flex flex-none items-center gap-1.5 rounded-md border px-3 py-1.5 whitespace-nowrap transition-all",
                isActive
                  ? "border-border bg-secondary text-foreground shadow-sm"
                  : "border-transparent text-muted hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  isActive ? "text-accent-strong" : "text-muted",
                )}
                aria-hidden="true"
              />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
      {showRightFade && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-lg bg-linear-to-l from-background to-transparent"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function researchTabLabel(
  tab: string | undefined,
  assetType?: AssetType | null,
  isEtf = false,
): string {
  const tabId = (tab as ResearchTabId | undefined) ?? "overview";

  if (tabId === "fundamentals" && (isEtf || assetType === "ETF")) {
    return "Fund metrics";
  }

  const direct = allTabs.find((entry) => entry.id === tabId);
  if (direct) {
    return direct.label;
  }

  const tabs = tabsForAssetType(assetType, isEtf);
  const found = tabs.find((entry) => entry.id === tabId);
  return found?.label ?? "Overview";
}

/** Pathname-only label for SSR-safe breadcrumbs (no asset-type detection). */
export function researchBreadcrumbLabel(tab: string | undefined): string {
  const tabId = (tab as ResearchTabId | undefined) ?? "overview";
  const direct = allTabs.find((entry) => entry.id === tabId);
  return direct?.label ?? "Overview";
}
