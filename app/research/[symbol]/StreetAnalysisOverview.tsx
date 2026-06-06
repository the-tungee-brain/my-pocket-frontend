"use client";

import Link from "next/link";
import { ChevronRight, Target } from "lucide-react";
import { useSession } from "next-auth/react";
import { useStreetAnalysis } from "@/app/hooks/useStreetAnalysis";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { symbolHubPath } from "@/lib/symbolRoutes";
import {
  formatStreetPrice,
  formatStreetUpside,
  hasStreetAnalysis,
} from "@/lib/streetAnalysisUtils";
import { cn } from "@/lib/utils";
import { StreetAnalysisSkeleton } from "./StreetAnalysisSection";
import { StreetAnalysisEmptyState } from "./StreetAnalysisEmptyState";

const WALL_STREET_ANALYSIS_SUBTITLE = "Consensus, target, and latest action";

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
        title="Wall Street analysis"
        description={WALL_STREET_ANALYSIS_SUBTITLE}
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
        title="Wall Street analysis"
        description={WALL_STREET_ANALYSIS_SUBTITLE}
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
        title="Wall Street analysis"
        description={WALL_STREET_ANALYSIS_SUBTITLE}
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
      title="Wall Street analysis"
      description={WALL_STREET_ANALYSIS_SUBTITLE}
      icon={Target}
      action={detailsLink}
      className={className}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {street.consensusLabel ? (
            <span className="rounded-full border border-accent/30 bg-accent-muted px-2 py-0.5 text-[11px] font-semibold text-accent-strong">
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
