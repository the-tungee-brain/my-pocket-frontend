"use client";

import { ChevronRight, Target } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useStreetAnalysis } from "@/app/hooks/useStreetAnalysis";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  formatStreetPrice,
  formatStreetUpside,
  hasStreetAnalysis,
} from "@/lib/streetAnalysisUtils";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { StreetAnalysisEmptyState } from "./StreetAnalysisEmptyState";
import { StreetAnalysisSkeleton } from "./StreetAnalysisSection";

const ANALYST_SIGNAL_SUBTITLE = "External analyst consensus and target context";

type StreetAnalysisOverviewProps = {
  symbol: string;
  className?: string;
};

export function StreetAnalysisOverview({
  symbol,
  className,
}: StreetAnalysisOverviewProps) {
  const { data: session } = useSession();
  const { isEtf } = useResearchAssetTypeContext();
  const { street, isLoading, error } = useStreetAnalysis(symbol, {
    accessToken: session?.accessToken,
    enabled: !isEtf,
  });

  if (isEtf) return null;

  const fundamentalsHref = symbolHubPath(symbol, "fundamentals");

  const detailsLink = (
    <Link
      href={fundamentalsHref}
      className="inline-flex items-center gap-0.5 text-[11px] font-medium text-accent-strong transition hover:underline"
    >
      Full analysis
      <ChevronRight className="h-3 w-3" aria-hidden />
    </Link>
  );

  if (isLoading) {
    return (
      <ResearchSectionCard
        title="Analyst signal"
        description={ANALYST_SIGNAL_SUBTITLE}
        icon={Target}
        className={className}
      >
        <StreetAnalysisSkeleton />
      </ResearchSectionCard>
    );
  }

  if (error) {
    return (
      <ResearchSectionCard
        title="Analyst signal"
        description={ANALYST_SIGNAL_SUBTITLE}
        icon={Target}
        className={className}
      >
        <ErrorBanner message={error} />
      </ResearchSectionCard>
    );
  }

  if (!hasStreetAnalysis(street)) {
    return (
      <ResearchSectionCard
        title="Analyst signal"
        description={ANALYST_SIGNAL_SUBTITLE}
        icon={Target}
        className={className}
      >
        <StreetAnalysisEmptyState />
      </ResearchSectionCard>
    );
  }

  const targets = street.priceTargets;
  const mean = targets?.mean;

  return (
    <ResearchSectionCard
      title="Analyst signal"
      description={ANALYST_SIGNAL_SUBTITLE}
      icon={Target}
      action={detailsLink}
      className={className}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {street.consensusLabel ? (
            <span className="text-sm font-semibold text-accent-strong">
              {street.consensusLabel}
            </span>
          ) : null}
          {mean != null ? (
            <span className="text-sm font-semibold tabular-nums text-foreground">
              Mean target {formatStreetPrice(mean)}
            </span>
          ) : null}
        </div>

        {targets?.upsideToMeanPct != null ? (
          <p className="text-sm text-muted">
            <span
              className={cn(
                "font-medium tabular-nums",
                targets.upsideToMeanPct >= 0 ? "text-success" : "text-danger",
              )}
            >
              {formatStreetUpside(targets.upsideToMeanPct)}
            </span>
            {targets.current != null ? (
              <span> · last {formatStreetPrice(targets.current)}</span>
            ) : null}
          </p>
        ) : null}

        {street.recentRatingActions?.[0] ? (
          <p className="text-sm text-muted">
            Latest:{" "}
            <span className="text-foreground">
              {street.recentRatingActions[0].firm} —{" "}
              {street.recentRatingActions[0].fromGrade
                ? `${street.recentRatingActions[0].fromGrade} → ${street.recentRatingActions[0].toGrade}`
                : street.recentRatingActions[0].toGrade}
            </span>
          </p>
        ) : null}
      </div>
    </ResearchSectionCard>
  );
}
