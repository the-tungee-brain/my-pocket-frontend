"use client";

import type { ReactNode } from "react";
import { appCalloutClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";
import { LoadingRegion } from "./LoadingRegion";
import { Skeleton } from "./Skeleton";

/** Staggered fade-in for skeleton blocks. */
export function LoadingStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("loading-stagger", className)}>{children}</div>;
}

/** Indeterminate top bar shown while refreshing existing content. */
export function LoadingProgressBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "loading-progress pointer-events-none absolute inset-x-0 top-0 z-10",
        className,
      )}
      aria-hidden="true"
    />
  );
}

type LoadingSurfaceProps = {
  /** First load with no cached content. */
  loading?: boolean;
  /** Background refresh while content is visible. */
  refreshing?: boolean;
  hasContent: boolean;
  label?: string;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Initial load → skeleton. Refresh with content → dim + progress bar.
 * Reuse anywhere async panels can show stale data while revalidating.
 */
export function LoadingSurface({
  loading = false,
  refreshing = false,
  hasContent,
  label = "Loading",
  skeleton,
  children,
  className,
}: LoadingSurfaceProps) {
  const initialLoad = loading && !hasContent;
  const showRefresh = (loading || refreshing) && hasContent;

  if (initialLoad) {
    return <>{skeleton}</>;
  }

  return (
    <div
      className={cn("relative min-w-0", className)}
      aria-busy={showRefresh || undefined}
    >
      {showRefresh ? <LoadingProgressBar /> : null}
      <div
        className={cn(
          "transition-opacity duration-200 motion-reduce:transition-none",
          showRefresh && "pointer-events-none opacity-50",
        )}
      >
        {children}
      </div>
      {showRefresh ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}

/** Generic research card body placeholder. */
export function ResearchCardLoading({
  rows = 3,
  label = "Loading section",
  className,
}: {
  rows?: number;
  label?: string;
  className?: string;
}) {
  return (
    <LoadingRegion label={label} className={className}>
      <LoadingStagger className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-12 rounded-xl" />
        ))}
      </LoadingStagger>
    </LoadingRegion>
  );
}

/** AI news brief overview block. */
export function NewsOverviewLoading({
  label = "Loading news brief",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <LoadingRegion label={label} className={className}>
      <LoadingStagger className="app-stack">
        <div className={cn(appCalloutClass, "space-y-2")}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="flex gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </LoadingStagger>
    </LoadingRegion>
  );
}

/** Market context aside body — matches NewsContextAside layout. */
export function NewsContextLoading({
  label = "Loading market context",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <LoadingRegion label={label} className={className}>
      <LoadingStagger className="app-stack">
        {[1, 2].map((block) => (
          <div key={block} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </LoadingStagger>
    </LoadingRegion>
  );
}

/** Coverage analysis aside body — matches NewsAnalysisAside layout. */
export function NewsAnalysisLoading({
  label = "Loading coverage analysis",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <LoadingRegion label={label} className={className}>
      <LoadingStagger className="app-stack">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          {[1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-10 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          {[1, 2].map((row) => (
            <Skeleton key={row} className="h-10 rounded-lg" />
          ))}
        </div>
      </LoadingStagger>
    </LoadingRegion>
  );
}
