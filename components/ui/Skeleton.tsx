import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted-bg", className)}
      aria-hidden
      {...props}
    />
  );
}

type SkeletonListProps = {
  rows?: number;
  rowClassName?: string;
  className?: string;
};

export function SkeletonList({
  rows = 3,
  rowClassName = "h-10 rounded-lg",
  className,
}: SkeletonListProps) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className={rowClassName} />
      ))}
    </div>
  );
}

type ResearchSectionSkeletonProps = {
  headerWidth?: string;
  rows?: number;
  rowClassName?: string;
  className?: string;
};

export function ResearchSectionSkeleton({
  headerWidth = "w-48",
  rows = 3,
  rowClassName = "h-12 rounded-xl",
  className,
}: ResearchSectionSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      <Skeleton className={cn("h-4", headerWidth)} />
      <SkeletonList rows={rows} rowClassName={rowClassName} className="space-y-2" />
    </div>
  );
}
