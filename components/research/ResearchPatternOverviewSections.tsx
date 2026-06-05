"use client";

import { Activity, Sparkles } from "lucide-react";
import type { SymbolIntelligence } from "@/app/types/intelligence";
import { PatternIntelligenceCard } from "@/components/PatternIntelligenceCard";
import { PatternTrendForecastCard } from "@/components/PatternTrendForecastCard";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { useSession } from "next-auth/react";
import { hasPatternForecast } from "@/lib/patternForecast";
import { hasPatternIntelligence } from "@/lib/patternIntelligence";
import { hasProFeature, PRO_FEATURE_LABELS } from "@/lib/planFeatures";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  intelligence: SymbolIntelligence | null;
  loading?: boolean;
  className?: string;
};

export function ResearchPatternOverviewSections({
  symbol,
  intelligence,
  loading = false,
  className,
}: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { plan } = useAccountPlan(accessToken);
  const patternTrendAllowed = hasProFeature(plan, "patternTrend");

  const forecast = intelligence?.patternForecast;
  const patternIntel = intelligence?.patternIntelligence;
  const showForecast = hasPatternForecast(forecast);
  const showChartIntel =
    hasPatternIntelligence(patternIntel) &&
    patternIntel?.chartIntelligence != null;
  const patternGap = intelligence?.dataGaps?.find(
    (gap) =>
      gap === "pattern_model_unavailable" ||
      gap === "pattern_analysis_unavailable",
  );
  const unavailableReason =
    patternGap === "pattern_model_unavailable"
      ? "The pattern model is not available in this environment."
      : "Pattern analysis is not available for this symbol right now.";

  if (loading && !intelligence) {
    return (
      <ResearchSectionCard
        title="Trend analysis"
        description="Loading pattern model…"
        icon={Activity}
        className={className}
      >
        <div className="h-24 animate-pulse rounded-xl bg-muted-bg/50" aria-busy />
      </ResearchSectionCard>
    );
  }

  const showUpsell = !patternTrendAllowed && !showForecast;

  if (patternTrendAllowed && intelligence && !showForecast && !showChartIntel) {
    return (
      <ResearchSectionCard
        title="Trend analysis"
        description="Unavailable"
        icon={Activity}
        className={className}
      >
        <p className="text-sm leading-relaxed text-muted">
          {patternGap
            ? unavailableReason
            : "Trend and chart intelligence are not available for this symbol yet."}
        </p>
      </ResearchSectionCard>
    );
  }

  if (!showForecast && !showUpsell && !showChartIntel) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {showForecast ? (
        <PatternTrendForecastCard
          forecast={forecast}
          symbol={symbol}
        />
      ) : showUpsell ? (
        <ResearchSectionCard
          title="5D Alpha"
          description="Pro feature"
          icon={Activity}
        >
          <p className="text-sm leading-relaxed text-muted">
            {PRO_FEATURE_LABELS.patternTrend.description}
          </p>
        </ResearchSectionCard>
      ) : null}

      {showChartIntel ? (
        <PatternIntelligenceCard intelligence={patternIntel} />
      ) : patternIntel && patternTrendAllowed ? (
        <ResearchSectionCard
          title="Chart intelligence"
          icon={Sparkles}
        >
          <p className="text-sm text-muted">
            Analyst summary is not available for this symbol yet.
          </p>
        </ResearchSectionCard>
      ) : null}
    </div>
  );
}
