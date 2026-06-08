"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
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
  StrategySymbolStatus,
} from "@/app/types/strategy";
import { PlaybookActionButtons } from "@/components/PlaybookActionButtons";
import { StrategyFlowDiagram } from "@/components/StrategyFlowDiagram";
import { StrategyWheelPhaseStepper } from "@/components/StrategyWheelPhaseStepper";
import {
  actionTypeLabel,
  formatStrategyPlaybookTitle,
  isWheelLikeStrategy,
  playbookHoldBadge,
  primaryPlaybookAction,
  symbolNeedsAttention,
} from "@/lib/strategyPlaybook";
import { getStrategyFlow } from "@/lib/strategyFlows";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { WheelBacktestPlaybookLink } from "@/components/WheelBacktestPlaybookLink";
import {
  appCalloutClass,
  appCalloutLabelClass,
  appIconBoxClass,
  appKpiClass,
  appSectionLabelClass,
} from "@/lib/appUi";
import { cn } from "@/lib/utils";

type Props = {
  strategy: InvestmentStrategy;
  accessToken?: string;
  wheelSymbols?: string[];
  wheelTargetDeltaMin?: number;
  wheelTargetDeltaMax?: number;
  wheelDteDays?: number;
  recommendations: StrategyRecommendations | null;
  catalogItem?: StrategyCatalogItem | null;
  loading?: boolean;
  onRunAction?: (action: StrategyNextAction) => void;
  onConnectSchwab?: () => void;
  connectingSchwab?: boolean;
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
  accessToken,
  wheelSymbols = [],
  wheelTargetDeltaMin,
  wheelTargetDeltaMax,
  wheelDteDays,
  recommendations,
  catalogItem,
  loading = false,
  onRunAction,
  onConnectSchwab,
  connectingSchwab = false,
  className,
}: Props) {
  const flow = useMemo(() => getStrategyFlow(strategy), [strategy]);
  const StrategyIcon = STRATEGY_ICONS[strategy] ?? Sparkles;
  const strategyTitle = formatStrategyPlaybookTitle(strategy, catalogItem);
  const strategySubtitle =
    catalogItem?.subtitle ?? "Your guided investing playbook";
  const symbolStatuses = recommendations?.symbolStatuses ?? [];
  const topAction = primaryPlaybookAction(recommendations);
  const showWheelStepper = isWheelLikeStrategy(strategy);
  const showWheelBacktest =
    strategy === "wheel" && !!accessToken && wheelSymbols.length > 0;
  const playbookSymbols = wheelSymbols.length
    ? wheelSymbols
    : (recommendations?.symbolStatuses ?? []).map((s) => s.symbol);

  if (loading) {
    return (
      <Card className={className} aria-hidden>
        <CardHeader bordered={false}>
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className} aria-label="Strategy playbook">
      <CardHeader>
        <CardTitle
          title="Strategy playbook"
          description={
            <>
              <span className="font-medium text-foreground">
                {strategyTitle}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {strategySubtitle}
              </span>
            </>
          }
          icon={
            <div className={appIconBoxClass}>
              <StrategyIcon className="h-4 w-4" aria-hidden />
            </div>
          }
        />
        <Link
          href="/settings?tab=strategy"
          className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground transition hover:border-accent/40 hover:bg-muted-bg"
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden />
          Edit
        </Link>
      </CardHeader>

      <CardBody spacious className="space-y-5">
        {topAction && (
          <div className={appCalloutClass}>
            <p className={appCalloutLabelClass}>Next up</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {topAction.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {topAction.reason}
            </p>
            <div className="mt-3">
              <PlaybookActionButtons
                action={topAction}
                onRunAction={onRunAction}
                onConnectSchwab={onConnectSchwab}
                connectingSchwab={connectingSchwab}
              />
            </div>
          </div>
        )}

        {symbolStatuses.length > 0 ? (
          <div>
            <p className={cn(appSectionLabelClass, "mb-3")}>Your symbols</p>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {symbolStatuses.map((status) => (
                <PlaybookSymbolCard
                  key={status.symbol}
                  strategy={strategy}
                  status={status}
                  showWheelStepper={showWheelStepper}
                  onRunAction={onRunAction}
                  onConnectSchwab={onConnectSchwab}
                  connectingSchwab={connectingSchwab}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-border/80 bg-muted-bg/30 px-3 py-4 text-center">
            <p className="text-sm font-medium text-foreground">
              No symbols on your playbook yet
            </p>
            <p className="mt-1 text-xs text-muted">
              Add tickers in settings or use the strategy screener to build your
              list.
            </p>
            <Link
              href="/settings?tab=strategy"
              className="mt-3 inline-flex bg-accent-muted/50 px-3 py-1 text-[11px] font-medium text-accent-strong transition hover:bg-accent-muted/70"
            >
              Add symbols
            </Link>
          </div>
        )}

        {showWheelBacktest && (
          <WheelBacktestPlaybookLink symbols={playbookSymbols} />
        )}

        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className={appSectionLabelClass}>How it works</p>
            {flow.repeats && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted">
                <RefreshCw className="h-3 w-3" aria-hidden />
                Repeating cycle
              </span>
            )}
          </div>
          <StrategyFlowDiagram flow={flow} fixedWideLayout />
        </div>
      </CardBody>
    </Card>
  );
}

function PlaybookSymbolCard({
  strategy,
  status,
  showWheelStepper,
  onRunAction,
  onConnectSchwab,
  connectingSchwab,
}: {
  strategy: InvestmentStrategy;
  status: StrategySymbolStatus;
  showWheelStepper: boolean;
  onRunAction?: (action: StrategyNextAction) => void;
  onConnectSchwab?: () => void;
  connectingSchwab?: boolean;
}) {
  const holdBadge = playbookHoldBadge(status);

  return (
    <div className={cn(appKpiClass, "min-h-0 justify-start py-3")}>
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
            "shrink-0 px-2 py-0.5 text-[10px] font-medium",
            holdBadge === "Held"
              ? "bg-accent-muted/40 text-accent-strong"
              : holdBadge === "Partial"
                ? "bg-secondary text-foreground"
                : "bg-muted-bg text-muted",
          )}
        >
          {holdBadge}
        </span>
      </div>

      {showWheelStepper && status.wheelPhase && (
        <StrategyWheelPhaseStepper
          strategy={strategy}
          phase={status.wheelPhase}
          className="mt-2"
        />
      )}

      {status.portfolioWeightPct != null && status.held && (
        <p className="mt-1 text-[10px] text-muted">
          {status.portfolioWeightPct.toFixed(1)}% of portfolio
        </p>
      )}

      {status.nextAction && (
        <div className="mt-2.5 space-y-2 border-t border-border pt-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="bg-muted-bg px-2 py-0.5 text-[10px] font-medium text-muted">
              {actionTypeLabel(status.nextAction.type)}
            </span>
          </div>
          <p className="text-xs font-medium leading-snug text-foreground">
            {status.nextAction.title}
          </p>
          <p className="text-[11px] leading-relaxed text-muted">
            {status.nextAction.reason}
          </p>
          <PlaybookActionButtons
            action={status.nextAction}
            onRunAction={onRunAction}
            onConnectSchwab={onConnectSchwab}
            connectingSchwab={connectingSchwab}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
