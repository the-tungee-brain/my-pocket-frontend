"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  Link2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useSchwabConnect } from "@/app/hooks/useSchwabConnect";
import type {
  JourneyStep,
  StrategyNextAction,
  StrategyRecommendations,
  UserStrategyJourney,
} from "@/app/types/strategy";
import { StrategyStockSuggestionsPanel } from "@/components/StrategyStockSuggestionsPanel";
import { Button } from "@/components/ui/Button";
import {
  isStrategyJourneyCollapsed,
  setStrategyJourneyCollapsed,
} from "@/lib/onboardingStorage";
import { cn } from "@/lib/utils";
import { symbolHubPath } from "@/lib/symbolRoutes";

type Props = {
  journey: UserStrategyJourney;
  recommendations: StrategyRecommendations | null;
  onRunAction: (action: StrategyNextAction) => void;
  onMarkLearned?: (stepId: string) => void;
  onAddSuggestedSymbol?: (symbol: string) => void;
  className?: string;
};

export function StrategyJourneyPanel({
  journey,
  recommendations,
  onRunAction,
  onMarkLearned,
  onAddSuggestedSymbol,
  className,
}: Props) {
  const router = useRouter();
  const { connect, connecting } = useSchwabConnect();
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

  const currentStep = recommendations?.currentStep ?? findCurrentStep(journey.steps);
  const nextActions = recommendations?.nextActions ?? [];
  const suggestedStocks = recommendations?.suggestedStocks ?? [];

  const handleAction = useCallback(
    (action: StrategyNextAction) => {
      if (action.type === "connect") {
        void connect();
        return;
      }
      if (action.symbol) {
        router.push(symbolHubPath(action.symbol, "position"));
      }
      onRunAction(action);
    },
    [connect, onRunAction, router],
  );

  return (
    <section className={cn("mx-auto mb-4 w-full max-w-3xl", className)}>
      <div className="rounded-2xl border border-accent/30 bg-accent-muted/20 shadow-sm">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={toggleExpanded}
          className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-accent-muted/30"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
              Strategy journey
            </p>
            <h2 className="mt-0.5 text-sm font-semibold text-foreground">
              {formatStrategyTitle(journey.strategy)}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {journey.completionPct}% complete
              {currentStep ? ` · Next: ${currentStep.title}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/settings"
              onClick={(event) => event.stopPropagation()}
              className="text-xs text-muted transition hover:text-accent-strong"
            >
              Edit
            </Link>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted transition-transform",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          </div>
        </button>

        {!expanded && (
          <div className="px-4 pb-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted-bg">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${journey.completionPct}%` }}
              />
            </div>
          </div>
        )}

        {expanded && (
          <div className="border-t border-accent/20 px-4 pb-4 pt-3">
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted-bg">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${journey.completionPct}%` }}
              />
            </div>

            {onAddSuggestedSymbol && (
              <div className="mb-4">
                <StrategyStockSuggestionsPanel
                  picks={suggestedStocks}
                  summary={recommendations?.stockSuggestionsSummary}
                  onAddSymbol={onAddSuggestedSymbol}
                  selectedSymbols={recommendations?.readiness.approvedSymbols ?? []}
                />
              </div>
            )}

            {nextActions.length > 0 && (
              <div className="mb-4 rounded-xl border border-border bg-background/50 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Next up
                </p>
                <div className="space-y-2">
                  {nextActions.slice(0, 2).map((action, index) => (
                    <button
                      key={`${action.title}-${index}`}
                      type="button"
                      onClick={() => handleAction(action)}
                      disabled={action.type === "connect" && connecting}
                      className="flex w-full items-start gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5 text-left transition hover:border-accent/30"
                    >
                      <ActionIcon type={action.type} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">
                          {action.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {action.reason}
                        </span>
                      </span>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ol className="space-y-2">
              {journey.steps.map((step) => (
                <li
                  key={step.stepId}
                  className={cn(
                    "flex gap-3 rounded-xl border px-3 py-2.5",
                    step.status === "completed" || step.status === "skipped"
                      ? "border-accent/20 bg-background/40"
                      : step.stepId === currentStep?.stepId
                        ? "border-accent/40 bg-background/60"
                        : "border-border bg-background/30 opacity-80",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      step.status === "completed" || step.status === "skipped"
                        ? "bg-accent-muted text-accent-strong"
                        : "bg-muted-bg text-muted",
                    )}
                  >
                    {step.status === "completed" || step.status === "skipped" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      step.order
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{step.description}</p>
                    {step.stepId.includes("learn") &&
                      step.status === "available" &&
                      onMarkLearned && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="mt-2"
                          onClick={() => onMarkLearned(step.stepId)}
                        >
                          Mark as read
                        </Button>
                      )}
                    {step.stepId === "connect-schwab" &&
                      step.status !== "completed" &&
                      step.status !== "skipped" && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="mt-2"
                          onClick={() => void connect()}
                          isLoading={connecting}
                        >
                          <Link2 className="h-3 w-3" />
                          Connect Schwab
                        </Button>
                      )}
                    {step.stepId === "research-underlying" &&
                      recommendations?.symbol &&
                      step.status !== "completed" && (
                        <Link
                          href={symbolHubPath(recommendations.symbol, "overview")}
                          className="mt-2 inline-flex text-[11px] font-medium text-accent-strong hover:underline"
                        >
                          Research {recommendations.symbol}
                        </Link>
                      )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}

function findCurrentStep(steps: JourneyStep[]): JourneyStep | undefined {
  return (
    steps.find(
      (step) => step.status === "available" || step.status === "in-progress",
    ) ?? steps.find((step) => step.status === "locked")
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

function ActionIcon({ type }: { type: StrategyNextAction["type"] }) {
  switch (type) {
    case "connect":
      return <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />;
    case "options":
      return (
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
      );
    case "buy":
      return (
        <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
      );
    default:
      return <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />;
  }
}
