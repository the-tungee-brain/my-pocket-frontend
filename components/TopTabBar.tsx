"use client";

import { KeyboardEvent, useRef } from "react";
import { Newspaper, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabId } from "@/app/contexts/TabContext";

type Tab = {
  id: TabId;
  label: string;
  icon: typeof Sparkles;
  panelId: string;
};

type TopTabBarProps = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  className?: string;
  showNews?: boolean;
};

const allTabs: Tab[] = [
  {
    id: "assistant",
    label: "Assistant",
    icon: Sparkles,
    panelId: "panel-assistant",
  },
  {
    id: "news",
    label: "News",
    icon: Newspaper,
    panelId: "panel-news",
  },
];

export function TopTabBar({
  activeTab,
  onChange,
  className,
  showNews = true,
}: TopTabBarProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabs = showNews
    ? allTabs
    : allTabs.filter((tab) => tab.id === "assistant");

  const focusTab = (index: number) => {
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      onChange(tabs[nextIndex].id);
      focusTab(nextIndex);
    }
  };

  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <nav
        className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted-bg/50 p-0.5 text-sm scrollbar-dark"
        role="tablist"
        aria-label="Portfolio views"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={tab.panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
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
