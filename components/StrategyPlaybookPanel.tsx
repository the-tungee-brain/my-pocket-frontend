"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
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
  StrategyNextAction,
  StrategyRecommendations,
} from "@/app/types/strategy";
import { StrategyFlowDiagram } from "@/components/StrategyFlowDiagram";
import {
  actionTypeLabel,
  formatStrategyPlaybookTitle,
  playbookActionAskable,
  primaryPlaybookAction,
} from "@/lib/strategyPlaybook";
import { getStrategyFlow } from "@/lib/strategyFlows";
import {
  isStrategyJourneyCollapsed,
  setStrategyJourneyCollapsed,
} from "@/lib/onboardingStorage";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

type Props = {
  strategy: InvestmentStrategy;
  recommendations: StrategyRecommendations | null;
  catalogItem?: StrategyCatalogItem | null;
  onRunAction?: (action: StrategyNextAction) => void;
  className?: string;
};

const STRATEGY_ICONS: Record<InvestmentStrategy, typeof RefreshCw> = {
  wheel: RefreshCw,
  "csp-income": CircleDollarSign,
  "covered-call": TrendingUp,
  dividend: CircleDollarSign,
  "etf-core": Layers,
};

export function StrategyPlaybookPanel({
  strategy,
  recommendations,
  catalogItem,
  onRunAction,
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
  const StrategyIcon = STRATEGY_ICONS[strategy] ?? Sparkles;
  const strategyTitle = formatStrategyPlaybookTitle(strategy, catalogItem);
  const strategySubtitle =
    catalogItem?.subtitle ?? "Your guided investing playbook";
  const strategyDescription =
    catalogItem?.description ??
    "Expand to see your playbook symbols and next steps.";
  const symbolStatuses = recommendations?.symbolStatuses ?? [];
  const topAction = primaryPlaybookAction(recommendations);

  return (
    <section className={cn("mx-auto w-full", className)}>
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
                  Strategy playbook
                </p>
                <h2 className="mt-0.5 text-sm font-semibold text-foreground">
                  {strategyTitle}
                </h2>
                <p className="mt-0.5 text-xs text-accent-strong/90">
                  {strategySubtitle}
                </p>
                {!expanded && symbolStatuses.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {symbolStatuses.slice(0, 5).map((status) => (
                      <span
                        key={status.symbol}
                        className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-foreground"
                      >
                        {status.symbol}
                      </span>
                    ))}
                  </div>
                )}
                {!expanded && !symbolStatuses.length && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                    {strategyDescription}
                  </p>
                )}
              </div>
            </div>
          </button>

          <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
            <Link
              href="/settings?tab=strategy"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-accent/40 hover:text-accent-strong"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              Edit playbook
            </Link>
            <IconButton
              size="sm"
              aria-label={expanded ? "Collapse playbook" : "Expand playbook"}
              onClick={toggleExpanded}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-180",
                )}
                aria-hidden
              />
            </IconButton>
          </div>
        </div>

        {expanded && (
          <div className="space-y-4 border-t border-accent/20 px-4 pb-4 pt-4">
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

            {topAction && (
              <div className="rounded-xl border border-accent/25 bg-background/70 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
                  Next up
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {topAction.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {topAction.reason}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {topAction.symbol && (
                    <Link
                      href={`/research/${encodeURIComponent(topAction.symbol)}/overview`}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-accent/40"
                    >
                      Open {topAction.symbol}
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </Link>
                  )}
                  {onRunAction && playbookActionAskable(topAction) && (
                    <button
                      type="button"
                      onClick={() => onRunAction(topAction)}
                      className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-muted/40 px-2.5 py-1 text-[11px] font-medium text-accent-strong transition hover:bg-accent-muted/60"
                    >
                      Ask AI{topAction.symbol ? ` about ${topAction.symbol}` : ""}
                    </button>
                  )}
                </div>
              </div>
            )}

            {symbolStatuses.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Your symbols
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {symbolStatuses.map((status) => (
                    <PlaybookSymbolCard
                      key={status.symbol}
                      status={status}
                      onRunAction={onRunAction}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function PlaybookSymbolCard({
  status,
  onRunAction,
}: {
  status: NonNullable<StrategyRecommendations["symbolStatuses"]>[number];
  onRunAction?: (action: StrategyNextAction) => void;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/60 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/research/${encodeURIComponent(status.symbol)}/overview`}
            className="text-sm font-semibold text-foreground hover:text-accent-strong"
          >
            {status.symbol}
          </Link>
          <p className="mt-0.5 text-[11px] text-muted">{status.statusLabel}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
            status.held
              ? "bg-accent-muted/50 text-accent-strong"
              : "bg-muted-bg text-muted",
          )}
        >
          {status.held ? "Held" : "Not held"}
        </span>
      </div>
      {status.portfolioWeightPct != null && status.held && (
        <p className="mt-1 text-[10px] text-muted">
          {status.portfolioWeightPct.toFixed(1)}% of portfolio
        </p>
      )}
      {status.nextAction && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted">
            {actionTypeLabel(status.nextAction.type)}
          </span>
          {onRunAction &&
            status.nextAction &&
            playbookActionAskable(status.nextAction) && (
            <button
              type="button"
              onClick={() => onRunAction(status.nextAction!)}
              className="text-[10px] font-medium text-accent-strong hover:underline"
            >
              Ask AI
            </button>
          )}
        </div>
      )}
    </div>
  );
}
