"use client";

type QuickAction = {
  id: string;
  label: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { id: "daily-summary", label: "Daily summary" },
  { id: "risk-check", label: "Risk check" },
  { id: "tax-angle", label: "Tax angle" },
  { id: "what-changed", label: "What changed today?" },
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
    <div className="mb-1 flex flex-wrap gap-2">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={loading}
          onClick={() => onRunAction(action.id)}
          className="transition-all duration-200 ease-out rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-foreground hover:bg-neutral-800/80 disabled:opacity-60"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
