import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
import { LoadingRegion } from "./LoadingRegion";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md", className)}
      aria-hidden
      {...props}
    />
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
  rowClassName = "h-10 rounded-lg",
  className,
  label = "Loading",
}: SkeletonListProps) {
  return (
    <LoadingRegion label={label} className={cn("space-y-2", className)}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className={rowClassName} />
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
  rowClassName = "h-12 rounded-xl",
  className,
  label = "Loading section",
}: ResearchSectionSkeletonProps) {
  return (
    <LoadingRegion label={label} className={cn("space-y-2", className)}>
      <Skeleton className={cn("h-4", headerWidth)} />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className={rowClassName} />
      ))}
    </LoadingRegion>
  );
}
