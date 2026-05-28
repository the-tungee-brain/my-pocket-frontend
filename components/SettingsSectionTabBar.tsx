"use client";

import { cn } from "@/lib/utils";

export type SettingsTabId = "connection" | "strategy" | "account";

const TABS: { id: SettingsTabId; label: string }[] = [
  { id: "connection", label: "Connection" },
  { id: "strategy", label: "Strategy" },
  { id: "account", label: "Account" },
];

type Props = {
  activeTab: SettingsTabId;
  onChange: (tab: SettingsTabId) => void;
  className?: string;
};

export function SettingsSectionTabBar({
  activeTab,
  onChange,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex w-full rounded-xl border border-border bg-secondary p-1",
        className,
      )}
      role="tablist"
      aria-label="Settings sections"
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
