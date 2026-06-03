"use client";

import type { InsightLine } from "@/lib/topMovers";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

type Props = {
  strengths: InsightLine[];
  gaps: InsightLine[];
  loading?: boolean;
  className?: string;
};

export function StrengthsGaps({ strengths, gaps, loading, className }: Props) {
  return (
    <div className={cn("space-y-5", loading && "opacity-60", className)}>
      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Strengths
        </h3>
        {loading ? (
          <ul className="space-y-2" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="h-4 w-56 animate-pulse rounded bg-muted-bg" />
            ))}
          </ul>
        ) : strengths.length === 0 ? (
          <p className="text-sm text-muted">Available after signal profile loads.</p>
        ) : (
          <ul className="space-y-2">
            {strengths.map((line) => (
              <li key={line.id} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-hidden
                />
                {line.label}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Missing signals
        </h3>
        {loading ? (
          <ul className="space-y-2" aria-busy="true">
            {Array.from({ length: 2 }).map((_, i) => (
              <li key={i} className="h-4 w-48 animate-pulse rounded bg-muted-bg" />
            ))}
          </ul>
        ) : gaps.length === 0 ? (
          <p className="text-sm text-muted">No major gaps in the signal profile.</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-foreground">
            {gaps.map((line) => (
              <li key={line.id} className="flex gap-2">
                <span className="font-bold text-muted" aria-hidden>
                  •
                </span>
                {line.label}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
