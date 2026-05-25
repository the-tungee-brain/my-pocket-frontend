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
  className?: string;
};

export function PortfolioSectionTabBar({
  activeSection,
  onChange,
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
        return (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(section.id)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {section.label}
          </button>
        );
      })}
    </div>
  );
}
