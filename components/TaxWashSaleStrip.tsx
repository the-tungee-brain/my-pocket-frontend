"use client";

import { Scale } from "lucide-react";
import type { TaxAlertItem } from "@/lib/intelligence";
import { findQuickAction } from "@/lib/quickActions";
import { cn } from "@/lib/utils";

type Props = {
  items: TaxAlertItem[];
  onRun?: (item: TaxAlertItem) => void;
  className?: string;
};

export function TaxWashSaleStrip({ items, onRun, className }: Props) {
  if (!items.length) return null;

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/5 shadow-sm",
        className,
      )}
      aria-label="Tax and wash-sale alerts"
    >
      <div className="flex items-start gap-3 border-b border-amber-500/20 px-4 py-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200">
          <Scale className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Tax & wash-sale watch
          </h2>
          <p className="text-[11px] text-muted">
            Recent sell/buy pairs that may affect tax lots
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border/70">
        {items.map((item) => {
          const quickAction = findQuickAction(item.actionId);
          const Icon = quickAction?.icon ?? Scale;

          return (
            <li key={item.id} className="px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                    {item.symbol && (
                      <span className="ml-1.5 font-mono text-accent-strong">
                        {item.symbol}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {item.reason}
                  </p>
                </div>
                {onRun && (
                  <button
                    type="button"
                    onClick={() => onRun(item)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-accent-strong transition hover:border-accent/40 hover:bg-muted-bg"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    Review tax angle
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
