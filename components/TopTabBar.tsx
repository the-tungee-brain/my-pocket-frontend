"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TabId } from "@/app/contexts/TabContext";

type Tab = {
  id: TabId;
  label: string;
  icon?: ReactNode;
};

type TopTabBarProps = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  className?: string;
};

const tabs: Tab[] = [
  {
    id: "assistant",
    label: "Assistant",
    icon: (
      <span className="mr-2 text-[14px]" aria-hidden="true">
        ✴️
      </span>
    ),
  },
  {
    id: "news",
    label: "News",
    icon: (
      <span className="mr-2 text-[14px]" aria-hidden="true">
        🌐
      </span>
    ),
  },
];

export function TopTabBar({ activeTab, onChange, className }: TopTabBarProps) {
  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <nav className="flex max-w-full gap-5 overflow-x-auto text-sm text-neutral-400">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex flex-none items-center pb-2 pt-3 whitespace-nowrap",
                "transition-colors",
                isActive
                  ? "text-neutral-100"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              <span className="font-medium">{tab.label}</span>

              {isActive && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-foreground" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
