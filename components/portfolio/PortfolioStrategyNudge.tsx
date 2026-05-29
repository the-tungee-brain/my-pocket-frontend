"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { appHighlightClass, appIconBoxClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

type Props = {
  onStart: () => void;
  className?: string;
};

/** Compact prompt when strategy onboarding was dismissed but not completed. */
export function PortfolioStrategyNudge({ onStart, className }: Props) {
  return (
    <div
      className={cn(
        appHighlightClass,
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className={appIconBoxClass}>
          <Target className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-accent-strong">
            Strategy setup
          </p>
          <p className="mt-0.5 text-sm text-muted">
            Choose a playbook for tailored checklists and Ask AI prompts.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={onStart}
          className="font-medium text-accent-strong hover:underline"
        >
          Start onboarding
        </button>
        <Link
          href="/settings"
          className="text-muted transition hover:text-foreground"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
