"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CalendarRange,
  ChevronDown,
  CircleDollarSign,
  FileSpreadsheet,
  Layers,
  LayoutDashboard,
  LineChart,
  type LucideIcon,
  Newspaper,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { AssetType } from "@/app/types/research";
import { appTabBarClass, appTabLinkClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

export type ResearchTabId =
  | "overview"
  | "day-trade"
  | "swing-trade"
  | "long-term"
  | "position"
  | "options"
  | "news"
  | "holdings"
  | "dividends"
  | "business"
  | "earnings"
  | "fundamentals"
  | "financials"
  | "wheel-backtest";

type Tab = {
  id: ResearchTabId;
  label: string;
  icon: LucideIcon;
  assetTypes?: AssetType[] | "all";
  requiresOptions?: boolean;
};

const TAB_GAP_PX = 4;

const allTabs: Tab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    assetTypes: "all",
  },
  {
    id: "day-trade",
    label: "Day Trade",
    icon: CalendarClock,
    assetTypes: "all",
  },
  {
    id: "swing-trade",
    label: "Swing Trade",
    icon: TrendingUp,
    assetTypes: "all",
  },
  {
    id: "long-term",
    label: "Long Term",
    icon: CalendarRange,
    assetTypes: "all",
  },
  {
    id: "position",
    label: "Positions",
    icon: BriefcaseBusiness,
    assetTypes: "all",
  },
  {
    id: "options",
    label: "Options",
    icon: Target,
    assetTypes: "all",
    requiresOptions: true,
  },
  { id: "news", label: "Events", icon: Newspaper, assetTypes: "all" },
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
  {
    id: "wheel-backtest",
    label: "Wheel backtest",
    icon: BarChart3,
    assetTypes: ["STOCK", "ADR", "ETF"],
  },
];

const standaloneResearchPageLabels: Record<string, string> = {};

function tabsForAssetType(
  assetType: AssetType | null | undefined,
  isEtf = false,
  showOptionsTab = false,
  showWheelBacktestTab = false,
): Tab[] {
  const resolved: AssetType = isEtf ? "ETF" : (assetType ?? "STOCK");
  const matched = allTabs.filter((tab) => {
    if (tab.id === "wheel-backtest" && !showWheelBacktestTab) return false;
    if (tab.requiresOptions && !showOptionsTab) return false;
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

function tabLinkClassName(isActive: boolean) {
  return appTabLinkClass(isActive);
}

function computeVisibleCount(
  containerWidth: number,
  tabWidths: number[],
  moreWidth: number,
): number {
  const total = tabWidths.length;
  if (total === 0 || containerWidth <= 0) return 0;

  let used = 0;
  for (let i = 0; i < total; i++) {
    used += tabWidths[i] + (i > 0 ? TAB_GAP_PX : 0);
  }
  if (used <= containerWidth) return total;

  used = 0;
  let count = 0;
  for (let i = 0; i < total; i++) {
    const tabWidth = tabWidths[i] + (i > 0 ? TAB_GAP_PX : 0);
    const hasOverflowAfter = i < total - 1;
    const requiredWidth =
      used + tabWidth + (hasOverflowAfter ? TAB_GAP_PX + moreWidth : 0);

    if (requiredWidth > containerWidth) break;

    used += tabWidth;
    count = i + 1;
  }

  return Math.max(1, count);
}

type ResearchTabLinkProps = {
  tab: Tab;
  href: string;
  isActive: boolean;
  onNavigate?: () => void;
  className?: string;
  measure?: boolean;
};

function ResearchTabLink({
  tab,
  href,
  isActive,
  onNavigate,
  className,
  measure = false,
}: ResearchTabLinkProps) {
  const Icon = tab.icon;

  return (
    <Link
      href={href}
      id={measure ? undefined : `research-tab-${tab.id}`}
      role={measure ? undefined : "tab"}
      aria-controls={measure ? undefined : `research-tabpanel-${tab.id}`}
      data-tab-measure={measure ? "" : undefined}
      onClick={onNavigate}
      className={cn(tabLinkClassName(isActive), className)}
      aria-selected={measure ? undefined : isActive}
      tabIndex={measure ? undefined : isActive ? 0 : -1}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5",
          isActive ? "text-accent-strong" : "text-muted",
        )}
        aria-hidden="true"
      />
      <span>{tab.label}</span>
    </Link>
  );
}

type ResearchTabBarProps = {
  symbol: string;
  assetType?: AssetType | null;
  isEtf?: boolean;
  showOptionsTab?: boolean;
  showWheelBacktestTab?: boolean;
  className?: string;
};

export function ResearchTabBar({
  symbol,
  assetType,
  isEtf = false,
  showOptionsTab = false,
  showWheelBacktestTab = false,
  className,
}: ResearchTabBarProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreMenuPosition, setMoreMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const encoded = encodeURIComponent(symbol.toUpperCase());
  const activeTab =
    (pathname.split("/")[3] as ResearchTabId | undefined) ?? "overview";
  const tabs = tabsForAssetType(
    assetType,
    isEtf,
    showOptionsTab,
    showWheelBacktestTab,
  );
  const tabSignature = tabs.map((tab) => tab.id).join("|");

  const recalculateVisibleTabs = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const tabWidths = Array.from(
      measure.querySelectorAll<HTMLElement>("[data-tab-measure]"),
    ).map((element) => element.offsetWidth);

    const moreMeasure = measure.querySelector<HTMLElement>(
      "[data-more-measure]",
    );
    const moreWidth = moreMeasure?.offsetWidth ?? 72;

    setVisibleCount(
      computeVisibleCount(container.clientWidth, tabWidths, moreWidth),
    );
  }, []);

  useLayoutEffect(() => {
    void tabSignature;
    recalculateVisibleTabs();
  }, [recalculateVisibleTabs, tabSignature]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      recalculateVisibleTabs();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [recalculateVisibleTabs]);

  const updateMoreMenuPosition = useCallback(() => {
    const button = moreButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    setMoreMenuPosition({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }, []);

  useLayoutEffect(() => {
    if (!moreOpen) {
      setMoreMenuPosition(null);
      return;
    }

    updateMoreMenuPosition();

    const handleReposition = () => updateMoreMenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [moreOpen, updateMoreMenuPosition]);

  useEffect(() => {
    void pathname;
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (moreMenuRef.current?.contains(target)) return;
      if (morePanelRef.current?.contains(target)) return;
      setMoreOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreOpen]);

  const resolvedVisibleCount = visibleCount ?? tabs.length;
  const visibleTabs = tabs.slice(0, resolvedVisibleCount);
  const overflowTabs = tabs.slice(resolvedVisibleCount);
  const overflowHasActive = overflowTabs.some((tab) => tab.id === activeTab);

  const moreMenu =
    moreOpen && moreMenuPosition && overflowTabs.length > 0 ? (
      <div
        ref={morePanelRef}
        role="menu"
        style={{
          top: moreMenuPosition.top,
          right: moreMenuPosition.right,
        }}
        className="fixed z-50 min-w-44 overflow-hidden border border-border bg-background py-1 shadow-lg"
      >
        {overflowTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={`/research/${encoded}/${tab.id}`}
              role="menuitem"
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs font-medium transition hover:bg-muted-bg/60",
                isActive
                  ? "bg-accent-muted/30 text-foreground"
                  : "text-muted hover:text-foreground",
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
              {tab.label}
            </Link>
          );
        })}
      </div>
    ) : null;

  return (
    <div ref={containerRef} className={cn("relative min-w-0", className)}>
      <div
        className={cn("flex min-w-0", appTabBarClass)}
        role="tablist"
        aria-label="Research sections"
      >
        {visibleTabs.map((tab) => (
          <ResearchTabLink
            key={tab.id}
            tab={tab}
            href={`/research/${encoded}/${tab.id}`}
            isActive={tab.id === activeTab}
          />
        ))}

        {overflowTabs.length > 0 && (
          <div ref={moreMenuRef} className="relative shrink-0">
            <button
              ref={moreButtonRef}
              type="button"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen((open) => !open)}
              className={tabLinkClassName(overflowHasActive)}
            >
              <span className="text-xs font-medium">More</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  moreOpen && "rotate-180",
                  overflowHasActive ? "text-accent-strong" : "text-muted",
                )}
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>

      {typeof document !== "undefined" && moreMenu
        ? createPortal(moreMenu, document.body)
        : null}

      <div
        ref={measureRef}
        className="pointer-events-none invisible absolute left-0 top-0 flex gap-1"
        aria-hidden="true"
      >
        {tabs.map((tab) => (
          <ResearchTabLink
            key={tab.id}
            tab={tab}
            href={`/research/${encoded}/${tab.id}`}
            isActive={false}
            measure
          />
        ))}
        <span data-more-measure className={tabLinkClassName(false)}>
          <span className="text-xs font-medium">More</span>
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
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

  const standaloneLabel = standaloneResearchPageLabels[tabId];
  if (standaloneLabel) {
    return standaloneLabel;
  }

  const tabs = tabsForAssetType(assetType, isEtf, tabId === "options");
  const found = tabs.find((entry) => entry.id === tabId);
  return found?.label ?? "Overview";
}

/** Pathname-only label for SSR-safe breadcrumbs (no asset-type detection). */
export function researchBreadcrumbLabel(tab: string | undefined): string {
  const tabId = (tab as ResearchTabId | undefined) ?? "overview";
  const direct = allTabs.find((entry) => entry.id === tabId);
  return direct?.label ?? standaloneResearchPageLabels[tabId] ?? "Overview";
}
