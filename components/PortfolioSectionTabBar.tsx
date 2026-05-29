"use client";

import { appTabBarClass, appTabLinkClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";
import type { PortfolioSectionId } from "@/app/contexts/PortfolioSectionContext";

const SECTIONS: { id: PortfolioSectionId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "news", label: "News" },
  { id: "holdings", label: "Holdings" },
  { id: "activity", label: "Activity" },
];

type Props = {
  activeSection: PortfolioSectionId;
  onChange: (section: PortfolioSectionId) => void;
  badges?: Partial<Record<PortfolioSectionId, number>>;
  className?: string;
};

export function PortfolioSectionTabBar({
  activeSection,
  onChange,
  badges = {},
  className,
}: Props) {
  return (
    <div
      className={cn(appTabBarClass, "w-full", className)}
      role="tablist"
      aria-label="Portfolio sections"
    >
      {SECTIONS.map((section) => {
        const active = activeSection === section.id;
        const badge = badges[section.id] ?? 0;
        return (
          <button
            key={section.id}
            type="button"
            role="tab"
            id={`portfolio-tab-${section.id}`}
            aria-controls={`portfolio-panel-${section.id}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(section.id)}
            className={cn(
              appTabLinkClass(active),
              "flex-1 justify-center",
            )}
          >
            <span>{section.label}</span>
            {badge > 0 && (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
                  active
                    ? "bg-accent/20 text-accent-strong"
                    : "bg-muted-bg text-muted",
                )}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
