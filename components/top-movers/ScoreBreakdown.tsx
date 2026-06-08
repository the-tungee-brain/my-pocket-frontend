"use client";

import type { ScoreBreakdownSegment } from "@/lib/topMovers";
import { cn } from "@/lib/utils";

type Props = {
  segments: ScoreBreakdownSegment[];
  loading?: boolean;
  className?: string;
};

export function ScoreBreakdown({ segments, loading, className }: Props) {
  if (loading) {
    return (
      <div className={cn("space-y-3", className)} aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 animate-pulse rounded bg-muted-bg" />
            <div className="h-2 animate-pulse rounded bg-muted-bg/80" />
          </div>
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <p className={cn("text-sm text-muted", className)}>
        Signal breakdown loads when research data is available for this symbol.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {segments.map((segment) => (
        <div key={segment.key}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">
              {segment.label}
            </span>
            <span className="text-sm font-semibold tabular-nums text-muted">
              {Math.round(segment.value * 100)}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden bg-muted-bg"
            role="meter"
            aria-valuenow={Math.round(segment.value * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={segment.label}
          >
            <div
              className="h-full bg-accent/80"
              style={{ width: `${Math.round(segment.value * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
