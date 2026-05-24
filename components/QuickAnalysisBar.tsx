"use client";

import { QUICK_ACTIONS } from "@/lib/quickActions";

interface QuickAnalysisBarProps {
  symbol: string;
  loading: boolean;
  onRunAction: (actionId: string) => Promise<void> | void;
}

export function QuickAnalysisBar({
  symbol,
  loading,
  onRunAction,
}: QuickAnalysisBarProps) {
  return (
    <fieldset className="mb-1 flex flex-wrap gap-2">
      <legend className="sr-only">Quick analysis</legend>
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;

        return (
          <button
            key={action.id}
            type="button"
            disabled={loading}
            aria-label={`${action.label} for ${symbol}`}
            onClick={() => onRunAction(action.id)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground transition-all duration-200 ease-out hover:border-accent/40 hover:bg-muted-bg disabled:opacity-60"
          >
            <Icon className="h-3 w-3 text-accent-strong" aria-hidden="true" />
            {action.label}
          </button>
        );
      })}
    </fieldset>
  );
}
