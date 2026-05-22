"use client";

import {
  CalendarDays,
  CircleHelp,
  Scale,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const QUICK_ACTIONS: QuickAction[] = [
  { id: "daily-summary", label: "Daily summary", icon: CalendarDays },
  { id: "risk-check", label: "Risk check", icon: ShieldAlert },
  { id: "tax-angle", label: "Tax angle", icon: Scale },
  { id: "what-changed", label: "What changed", icon: CircleHelp },
];

interface QuickAnalysisBarProps {
  symbol: string;
  loading: boolean;
  onRunAction: (actionId: string) => Promise<void> | void;
}

export function QuickAnalysisBar({
  symbol, // kept in case you later want tooltips, etc.
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
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground transition-all duration-200 ease-out hover:border-neutral-500 hover:bg-neutral-800/80 disabled:opacity-60"
          >
            <Icon className="h-3 w-3 text-emerald-300" aria-hidden="true" />
            {action.label}
          </button>
        );
      })}
    </fieldset>
  );
}
