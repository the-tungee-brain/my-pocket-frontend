"use client";

import type { ValuationSignal } from "@/app/hooks/useFundamentals";

type ValuationSignalsSectionProps = {
  signals: ValuationSignal[] | null | undefined;
};

export function ValuationSignalsSection({
  signals,
}: ValuationSignalsSectionProps) {
  if (!signals?.length) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {signals.map((signal) => (
        <div
          key={`${signal.label}-${signal.value}`}
          className="border border-border bg-background/60 px-3 py-2.5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {signal.label}
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {signal.value}
          </p>
          {signal.note ? (
            <p className="mt-1 text-[11px] text-muted">{signal.note}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
