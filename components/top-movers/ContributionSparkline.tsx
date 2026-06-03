"use client";

import { sparklineBarSpec } from "@/lib/topMovers";
import { cn } from "@/lib/utils";

type Props = {
  values: number[];
  pending?: boolean;
  className?: string;
};

const BAR_TONE_CLASS = {
  strong: "bg-accent",
  moderate: "bg-accent/60",
  weak: "bg-warning",
  missing: "bg-border",
} as const;

function SparklinePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-[22px] w-7 items-end justify-center gap-0.5",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="w-1 animate-pulse rounded-sm bg-muted-bg"
          style={{ height: `${[10, 14, 12, 8, 6][i]}px` }}
        />
      ))}
    </div>
  );
}

export function ContributionSparkline({ values, pending, className }: Props) {
  if (pending || values.every((v) => v === 0)) {
    return <SparklinePlaceholder className={className} />;
  }

  return (
    <div
      className={cn(
        "flex h-[22px] w-7 items-end justify-center gap-0.5",
        className,
      )}
      aria-hidden
    >
      {values.map((value, i) => {
        const spec = sparklineBarSpec(value);
        return (
          <span
            key={i}
            className={cn("w-1 rounded-sm", BAR_TONE_CLASS[spec.tone])}
            style={{ height: `${spec.heightPx}px` }}
          />
        );
      })}
    </div>
  );
}
