"use client";

import { Newspaper, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabId } from "@/app/contexts/TabContext";

type Tab = {
  id: TabId;
  label: string;
  icon: typeof Sparkles;
};

type TopTabBarProps = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  className?: string;
};

const tabs: Tab[] = [
  { id: "assistant", label: "Assistant", icon: Sparkles },
  { id: "news", label: "News", icon: Newspaper },
];

export function TopTabBar({ activeTab, onChange, className }: TopTabBarProps) {
  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <nav className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted-bg/50 p-0.5 text-sm">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex flex-none items-center gap-1.5 rounded-md px-3 py-1.5 whitespace-nowrap transition-all",
                isActive
                  ? "bg-secondary text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  isActive ? "text-accent-strong" : "text-muted",
                )}
                aria-hidden="true"
              />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
