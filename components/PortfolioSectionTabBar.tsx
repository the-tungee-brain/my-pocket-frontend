"use client";

import { cn } from "@/lib/utils";
import type { PortfolioSectionId } from "@/app/contexts/PortfolioSectionContext";

const SECTIONS: { id: PortfolioSectionId; label: string }[] = [
  { id: "today", label: "Today" },
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
      className={cn(
        "mx-auto mb-4 flex w-full max-w-3xl rounded-xl border border-border bg-secondary p-1",
        className,
      )}
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
            aria-selected={active}
            onClick={() => onChange(section.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            <span>{section.label}</span>
            {badge > 0 && (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  active
                    ? "bg-accent-muted text-accent-strong"
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
