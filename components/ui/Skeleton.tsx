import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { LoadingRegion } from "./LoadingRegion";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("skeleton-shimmer", className)} aria-hidden {...props} />
  );
}

type SkeletonListProps = {
  rows?: number;
  rowClassName?: string;
  className?: string;
  label?: string;
};

export function SkeletonList({
  rows = 3,
  rowClassName = "h-10",
  className,
  label = "Loading",
}: SkeletonListProps) {
  const rowKeys = Array.from(
    { length: rows },
    (_, index) => `skeleton-row-${index}`,
  );

  return (
    <LoadingRegion label={label} className={cn("space-y-2", className)}>
      {rowKeys.map((key) => (
        <Skeleton key={key} className={rowClassName} />
      ))}
    </LoadingRegion>
  );
}

type ResearchSectionSkeletonProps = {
  headerWidth?: string;
  rows?: number;
  rowClassName?: string;
  className?: string;
  label?: string;
};

export function ResearchSectionSkeleton({
  headerWidth = "w-48",
  rows = 3,
  rowClassName = "h-12",
  className,
  label = "Loading section",
}: ResearchSectionSkeletonProps) {
  const rowKeys = Array.from(
    { length: rows },
    (_, index) => `research-skeleton-row-${index}`,
  );

  return (
    <LoadingRegion label={label} className={cn("space-y-2", className)}>
      <Skeleton className={cn("h-4", headerWidth)} />
      {rowKeys.map((key) => (
        <Skeleton key={key} className={rowClassName} />
      ))}
    </LoadingRegion>
  );
}
