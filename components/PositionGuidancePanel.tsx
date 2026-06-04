"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import { usePositionGuidance } from "@/app/hooks/usePositionGuidance";
import type {
  PortfolioExitAttentionItem,
  PositionGuidanceItem,
  PositionKind,
  PositionVerdict,
  SymbolPositionGuidance,
} from "@/app/types/positionGuidance";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  buildPositionDriverDisplay,
  formatProfitLossPct,
  positionContractLine,
  positionKindHeading,
  rankedScoringContributors,
  driverCategory,
  contributorScoringLabel,
} from "@/lib/guidanceScoringContributors";
import {
  buildPositionPlainEnglish,
  formatSymbolThesisPlainEnglish,
  urgencyQualitativeLabel,
} from "@/lib/guidancePlainEnglish";
import { symbolPositionPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string | null;
  accessToken?: string | null;
  enabled?: boolean;
  className?: string;
  guidanceProp?: SymbolPositionGuidance | null;
  isLoadingProp?: boolean;
  errorProp?: string | null;
};

const VERDICT_LABEL: Record<PositionVerdict, string> = {
  HOLD: "Hold",
  TRIM: "Trim",
  REVIEW_SELL: "Review sell",
  EXIT: "Exit",
  REVIEW_CLOSE: "Review close",
  CLOSE: "Close",
  ROLL: "Roll",
  REVIEW_ASSIGNMENT_RISK: "Review assignment risk",
};

function verdictTone(verdict: PositionVerdict): string {
  switch (verdict) {
    case "HOLD":
      return "text-success";
    case "TRIM":
    case "ROLL":
      return "text-accent-highlight";
    case "REVIEW_SELL":
    case "REVIEW_CLOSE":
    case "REVIEW_ASSIGNMENT_RISK":
      return "text-warning";
    case "EXIT":
    case "CLOSE":
      return "text-danger";
  }
}

function LegGuidanceBlock({
  item,
  copy,
}: {
  item: PositionGuidanceItem;
  copy: ReturnType<typeof buildPositionPlainEnglish>;
}) {
  const pl =
    item.openProfitLossPct != null
      ? formatProfitLossPct(item.openProfitLossPct)
      : null;

  return (
    <article className="rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-foreground">
      <p className="font-semibold">{positionKindHeading(item.positionKind)}</p>
      <p className="text-muted-foreground">{positionContractLine(item)}</p>

      <p className="mt-3 text-base font-bold">
        <span className={cn(verdictTone(item.verdict))}>
          {VERDICT_LABEL[item.verdict]}
        </span>
      </p>
      {item.verdict !== "HOLD" ? (
        <p className="text-muted-foreground">
          {urgencyQualitativeLabel(item.urgency)}
        </p>
      ) : null}
      {pl ? <p className="text-muted-foreground">P/L {pl}</p> : null}

      {copy.mainReason ? (
        <div className="mt-4">
          <p className="font-semibold text-foreground">Main reason:</p>
          <p className="mt-1 leading-relaxed text-foreground">
            {copy.mainReason}
          </p>
        </div>
      ) : null}

      {copy.supportingPoints.length > 0 ? (
        <div className="mt-4">
          <p className="font-semibold text-foreground">Also contributing:</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 leading-relaxed text-muted-foreground">
            {copy.supportingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function SymbolThesisLine({
  guidance,
}: {
  guidance: SymbolPositionGuidance;
}) {
  if (!guidance.thesis) return null;

  const positions = guidance.positions ?? [];
  const hasRegimeInPositions = positions.some((item) =>
    rankedScoringContributors(item).some(
      (c) => driverCategory(c) === "regime",
    ),
  );
  const hasTradeQualityInPositions = positions.some((item) =>
    rankedScoringContributors(item).some((c) =>
      contributorScoringLabel(c).toLowerCase().includes("trade quality"),
    ),
  );

  return (
    <p className="text-sm font-medium leading-relaxed text-foreground">
      {formatSymbolThesisPlainEnglish(guidance.thesis, {
        hasRegimeInPositions,
        hasTradeQualityInPositions,
      })}
    </p>
  );
}

export function PositionGuidancePanel({
  symbol,
  accessToken,
  enabled = true,
  className,
  guidanceProp,
  isLoadingProp,
  errorProp,
}: Props) {
  const fetchInternally = guidanceProp === undefined && isLoadingProp === undefined;
  const internal = usePositionGuidance(symbol, {
    accessToken,
    enabled: enabled && fetchInternally,
  });
  const guidance = guidanceProp !== undefined ? guidanceProp : internal.guidance;
  const isLoading =
    isLoadingProp !== undefined ? isLoadingProp : internal.isLoading;
  const error = errorProp !== undefined ? errorProp : internal.error;

  const positionCopy = useMemo(() => {
    if (!guidance?.hasPositions || guidance.positions.length === 0) {
      return new Map<string, ReturnType<typeof buildPositionPlainEnglish>>();
    }
    const drivers = buildPositionDriverDisplay(guidance.positions);
    const map = new Map<string, ReturnType<typeof buildPositionPlainEnglish>>();
    for (const item of guidance.positions) {
      map.set(
        item.positionKey,
        buildPositionPlainEnglish(
          item,
          drivers.get(item.positionKey) ?? [],
        ),
      );
    }
    return map;
  }, [guidance]);

  if (!symbol) return null;

  if (isLoading && !guidance) {
    return (
      <ResearchSectionCard title="Position guidance" className={className}>
        <Skeleton className="h-32 w-full" />
      </ResearchSectionCard>
    );
  }

  if (error && !guidance) {
    return (
      <ResearchSectionCard title="Position guidance" className={className}>
        <ErrorBanner message={error} />
      </ResearchSectionCard>
    );
  }

  if (!guidance) return null;

  return (
    <ResearchSectionCard
      title="Position guidance"
      icon={ShieldAlert}
      className={className}
    >
      <div className="space-y-3">
        <SymbolThesisLine guidance={guidance} />

        {guidance.hasPositions && guidance.positions.length > 0 ? (
          guidance.positions.map((item) => (
            <LegGuidanceBlock
              key={item.positionKey}
              item={item}
              copy={positionCopy.get(item.positionKey) ?? {
                mainReason: null,
                supportingPoints: [],
              }}
            />
          ))
        ) : (
          <p className="text-sm text-muted">No open positions.</p>
        )}
      </div>
    </ResearchSectionCard>
  );
}

export function PortfolioExitAttentionRows({
  items,
  className,
}: {
  items: PortfolioExitAttentionItem[];
  className?: string;
}) {
  const KIND_HEADING: Record<PositionKind, string> = {
    EQUITY_LONG: "Equity",
    LONG_CALL: "Long call",
    LONG_PUT: "Long put",
    SHORT_CALL: "Short call",
    SHORT_PUT: "Short put",
  };

  if (items.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        Positions to review
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((row) => (
          <Link
            key={row.positionKey}
            href={symbolPositionPath(row.symbol)}
            className="rounded-lg border border-border bg-background/60 px-3 py-2 transition-colors hover:border-accent-highlight/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-accent-strong">
                {row.symbol}
              </span>
              <div className="text-right">
                <p className={cn("text-xs font-bold", verdictTone(row.verdict))}>
                  {VERDICT_LABEL[row.verdict]}
                </p>
                {row.verdict !== "HOLD" ? (
                  <p className="text-[10px] text-muted">
                    {urgencyQualitativeLabel(row.urgency)}
                  </p>
                ) : null}
              </div>
            </div>
            <p className="text-[10px] text-muted">
              {KIND_HEADING[row.positionKind]} · {row.displayLabel}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
