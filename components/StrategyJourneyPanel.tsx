"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  CircleDollarSign,
  Layers,
  RefreshCw,
  Settings2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type {
  InvestmentStrategy,
  StrategyCatalogItem,
} from "@/app/types/strategy";
import { StrategyFlowDiagram } from "@/components/StrategyFlowDiagram";
import { getStrategyFlow } from "@/lib/strategyFlows";
import {
  isStrategyJourneyCollapsed,
  setStrategyJourneyCollapsed,
} from "@/lib/onboardingStorage";
import { cn } from "@/lib/utils";

type Props = {
  strategy: InvestmentStrategy;
  catalogItem?: StrategyCatalogItem | null;
  className?: string;
};

const STRATEGY_ICONS: Record<
  InvestmentStrategy,
  typeof RefreshCw
> = {
  wheel: RefreshCw,
  "csp-income": CircleDollarSign,
  "covered-call": TrendingUp,
  dividend: CircleDollarSign,
  "etf-core": Layers,
};

export function StrategyJourneyPanel({
  strategy,
  catalogItem,
  className,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(!isStrategyJourneyCollapsed());
  }, []);

  const toggleExpanded = () => {
    setExpanded((open) => {
      const next = !open;
      setStrategyJourneyCollapsed(!next);
      return next;
    });
  };

  const flow = useMemo(() => getStrategyFlow(strategy), [strategy]);

  const strategyTitle = catalogItem?.title ?? formatStrategyTitle(strategy);
  const strategySubtitle =
    catalogItem?.subtitle ?? "Your guided investing playbook";
  const strategyDescription =
    catalogItem?.description ??
    "Expand to see how this strategy works step by step.";
  const StrategyIcon = STRATEGY_ICONS[strategy] ?? Sparkles;

  return (
    <section className={cn("mx-auto mb-4 w-full max-w-3xl", className)}>
      <div className="overflow-hidden rounded-2xl border border-accent/30 bg-accent-muted/20 shadow-sm">
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={toggleExpanded}
            className="min-w-0 flex-1 text-left transition hover:opacity-90"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent-muted/70 text-accent-strong">
                <StrategyIcon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
                  Your strategy
                </p>
                <h2 className="mt-0.5 text-sm font-semibold text-foreground">
                  {strategyTitle}
                </h2>
                <p className="mt-0.5 text-xs text-accent-strong/90">
                  {strategySubtitle}
                </p>
                {!expanded && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                    {strategyDescription}
                  </p>
                )}
              </div>
            </div>
          </button>

          <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-accent/40 hover:text-accent-strong"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              Edit strategy
            </Link>
            <button
              type="button"
              aria-label={expanded ? "Collapse strategy" : "Expand strategy"}
              onClick={toggleExpanded}
              className="rounded-lg p-1 text-muted transition hover:bg-muted-bg hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-4 border-t border-accent/20 px-4 pb-4 pt-4">
            <div className="rounded-xl border border-border/80 bg-background/50 px-3 py-3">
              <p className="text-sm leading-relaxed text-muted">
                {strategyDescription}
              </p>
              {catalogItem?.bestFor?.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {catalogItem.bestFor.slice(0, 3).map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  How it works
                </p>
                {flow.repeats && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted">
                    <RefreshCw className="h-3 w-3" aria-hidden />
                    Repeating cycle
                  </span>
                )}
              </div>
              <StrategyFlowDiagram flow={flow} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function formatStrategyTitle(strategy: string): string {
  switch (strategy) {
    case "wheel":
      return "Wheel strategy";
    case "csp-income":
      return "Cash-secured puts";
    case "covered-call":
      return "Covered calls";
    case "dividend":
      return "Dividend investing";
    case "etf-core":
      return "ETF core portfolio";
    default:
      return strategy;
  }
}
