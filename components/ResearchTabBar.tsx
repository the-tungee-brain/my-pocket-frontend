"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  FileSpreadsheet,
  LayoutDashboard,
  LineChart,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ResearchTabId =
  | "overview"
  | "business"
  | "earnings"
  | "fundamentals"
  | "financials";

type Tab = {
  id: ResearchTabId;
  label: string;
  icon: LucideIcon;
};

const tabs: Tab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "business", label: "Business", icon: BriefcaseBusiness },
  { id: "earnings", label: "Earnings", icon: TrendingUp },
  { id: "fundamentals", label: "Fundamentals", icon: FileSpreadsheet },
  { id: "financials", label: "Financials", icon: LineChart },
];

type ResearchTabBarProps = {
  symbol: string;
  className?: string;
};

export function ResearchTabBar({ symbol, className }: ResearchTabBarProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [showRightFade, setShowRightFade] = useState(false);
  const encoded = encodeURIComponent(symbol.toUpperCase());
  const activeTab =
    (pathname.split("/")[3] as ResearchTabId | undefined) ?? "overview";

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
  }, [symbol]);

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

export function researchTabLabel(tab: string | undefined): string {
  const found = tabs.find((t) => t.id === tab);
  return found?.label ?? "Overview";
}
