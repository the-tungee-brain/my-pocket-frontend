"use client";

import { cn } from "@/lib/utils";

type Props = {
  hasMlMetrics?: boolean;
  className?: string;
};

export function TopMoversHeader({ hasMlMetrics = true, className }: Props) {
  return (
    <header className={cn("space-y-1", className)}>
      <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
        Top Movers
      </h1>
      <p className="text-sm text-muted">
        {hasMlMetrics
          ? "ML-ranked leaders vs the full universe"
          : "Composite-ranked leaders vs the full universe"}
      </p>
    </header>
  );
}
