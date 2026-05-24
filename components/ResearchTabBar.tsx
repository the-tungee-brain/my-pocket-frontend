"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  FileSpreadsheet,
  LayoutDashboard,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ResearchTabId =
  | "overview"
  | "business"
  | "earnings"
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
  { id: "financials", label: "Financials", icon: FileSpreadsheet },
];

type ResearchTabBarProps = {
  symbol: string;
  className?: string;
};

export function ResearchTabBar({ symbol, className }: ResearchTabBarProps) {
  const pathname = usePathname();
  const encoded = encodeURIComponent(symbol.toUpperCase());
  const activeTab =
    (pathname.split("/")[3] as ResearchTabId | undefined) ?? "overview";

  return (
    <nav
      className={cn(
        "flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted-bg/50 p-0.5 scrollbar-dark",
        className,
      )}
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
              "relative flex flex-none items-center gap-1.5 rounded-md px-3 py-1.5 whitespace-nowrap transition-all",
              isActive
                ? "bg-secondary text-foreground shadow-sm ring-1 ring-border"
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
            <span className="text-xs font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function researchTabLabel(tab: string | undefined): string {
  const found = tabs.find((t) => t.id === tab);
  return found?.label ?? "Overview";
}
