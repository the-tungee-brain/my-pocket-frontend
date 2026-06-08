"use client";

import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function CompositeModelBanner({ className }: Props) {
  return (
    <div
      className={cn(
        "flex gap-3 border border-border bg-muted-bg/40 px-4 py-3",
        className,
      )}
      role="note"
    >
      <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">
          Composite Ranking Model
        </p>
        <p className="text-xs text-muted">
          This run ranks on composite scores only. ML probability and expected
          excess return are not shown.
        </p>
      </div>
    </div>
  );
}
