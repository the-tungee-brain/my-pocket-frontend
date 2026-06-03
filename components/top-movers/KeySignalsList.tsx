"use client";

import type { KeySignal } from "@/lib/topMovers";
import { cn } from "@/lib/utils";
import { CheckCircle2, MinusCircle } from "lucide-react";

type Props = {
  signals: KeySignal[];
  loading?: boolean;
  className?: string;
};

export function KeySignalsList({ signals, loading, className }: Props) {
  return (
    <section className={cn("space-y-2", className)}>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        Key signals
      </h3>
      {loading ? (
        <ul className="space-y-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-4 w-48 animate-pulse rounded bg-muted-bg" />
          ))}
        </ul>
      ) : signals.length === 0 ? (
        <p className="text-sm text-muted">
          Signals appear when pattern intelligence is available for this symbol.
        </p>
      ) : (
        <ul className="space-y-2">
          {signals.map((signal) => (
            <li key={signal.id} className="flex items-start gap-2 text-sm">
              {signal.positive ? (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-hidden
                />
              ) : (
                <MinusCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                  aria-hidden
                />
              )}
              <span className="text-foreground">{signal.label}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
