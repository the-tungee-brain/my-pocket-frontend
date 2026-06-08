"use client";

import type { ContributionTier, ScoreBreakdownSegment } from "@/lib/topMovers";
import { contributionBarWidth, showsContributionFill } from "@/lib/topMovers";
import { cn } from "@/lib/utils";

type Props = {
  segments: ScoreBreakdownSegment[];
  loading?: boolean;
  className?: string;
};

const TIER_CLASS: Record<ContributionTier, string> = {
  strong: "bg-accent/15 text-accent",
  moderate: "bg-success/15 text-success",
  weak: "bg-warning/15 text-warning",
  missing: "bg-muted-bg text-muted",
};

const BAR_CLASS: Record<ContributionTier, string> = {
  strong: "bg-accent",
  moderate: "bg-accent/65",
  weak: "bg-warning/90",
  missing: "bg-muted-foreground/35",
};

export function ContributionBreakdown({ segments, loading, className }: Props) {
  if (loading) {
    return (
      <div className={cn("space-y-3", className)} aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted-bg" />
            <div className="h-2 animate-pulse rounded bg-muted-bg/80" />
          </div>
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <p className={cn("text-sm text-muted", className)}>
        Contribution profile loads from pattern intelligence.
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {segments.map((segment) => {
        const fillWidth = contributionBarWidth(segment.tier, segment.value);
        const hasFill = showsContributionFill(segment.tier, segment.value);

        return (
          <div key={segment.key}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {segment.label}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  TIER_CLASS[segment.tier],
                )}
              >
                {segment.tierLabel}
              </span>
            </div>
            <div
              className={cn(
                "relative h-2.5 overflow-hidden bg-muted-bg",
                !hasFill && "ring-1 ring-inset ring-border/80",
              )}
              role="meter"
              aria-valuenow={Math.round(segment.value * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${segment.label}, ${segment.tierLabel}`}
            >
              {hasFill ? (
                <div
                  className={cn(
                    "h-full transition-[width]",
                    BAR_CLASS[segment.tier],
                  )}
                  style={{ width: `${fillWidth}%` }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
