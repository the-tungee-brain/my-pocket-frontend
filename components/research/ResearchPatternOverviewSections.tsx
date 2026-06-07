"use client";

import { Activity, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import type { SymbolIntelligence } from "@/app/types/intelligence";
import { PatternIntelligenceCard } from "@/components/PatternIntelligenceCard";
import { PatternTrendForecastCard } from "@/components/PatternTrendForecastCard";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import {
  formatPatternPercent,
  hasPatternForecast,
  patternDirectionLabel,
  patternDirectionSubtitle,
  patternDirectionTone,
  patternUpProbLabel,
} from "@/lib/patternForecast";
import {
  hasChartAnalystSummary,
  hasPatternIntelligence,
  outlookHeadline,
  patternIntelligencePatternSubtitle,
  patternIntelligencePrimaryPattern,
} from "@/lib/patternIntelligence";
import { hasProFeature, PRO_FEATURE_LABELS } from "@/lib/planFeatures";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  intelligence: SymbolIntelligence | null;
  loading?: boolean;
  mode?: "summary" | "full";
  className?: string;
};

function SummaryMetric({
  label,
  value,
  subValue,
  tone = "default",
}: {
  label: string;
  value: string;
  subValue?: string | null;
  tone?: "default" | "positive" | "negative" | "neutral" | "warning";
}) {
  return (
    <div className="border border-border bg-background/60 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold",
          tone === "positive" && "text-success",
          tone === "negative" && "text-danger",
          tone === "warning" && "text-warning",
          (tone === "default" || tone === "neutral") && "text-foreground",
        )}
      >
        {value}
      </p>
      {subValue ? (
        <p className="mt-0.5 text-xs text-muted">{subValue}</p>
      ) : null}
    </div>
  );
}

export function ResearchPatternOverviewSections({
  symbol,
  intelligence,
  loading = false,
  mode = "full",
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
        title="Price structure evidence"
        description="Loading pattern model…"
        icon={Activity}
        className={className}
      >
        <div className="h-24 animate-pulse bg-muted-bg/50" aria-busy />
      </ResearchSectionCard>
    );
  }

  const showUpsell = !patternTrendAllowed && !showForecast;

  if (patternTrendAllowed && intelligence && !showForecast && !showChartIntel) {
    return (
      <ResearchSectionCard
        title="Price structure evidence"
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

  if (mode === "summary") {
    const chartSummary = patternIntel?.chartIntelligence?.summary;
    const primaryPattern =
      patternIntel && hasPatternIntelligence(patternIntel)
        ? patternIntelligencePrimaryPattern(patternIntel)
        : null;
    const chartHeadline =
      chartSummary && hasChartAnalystSummary(patternIntel?.chartIntelligence)
        ? outlookHeadline(chartSummary.outlook)
        : null;
    const patternLine = primaryPattern
      ? `${primaryPattern.label} · ${patternIntelligencePatternSubtitle(primaryPattern)}`
      : null;

    return (
      <ResearchSectionCard
        title="Price structure evidence"
        description="Relative strength model and chart read"
        icon={Activity}
        className={className}
      >
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {showForecast && forecast ? (
              <>
                <SummaryMetric
                  label="Relative strength"
                  value={patternDirectionLabel(forecast)}
                  subValue={patternDirectionSubtitle(forecast)}
                  tone={patternDirectionTone(forecast)}
                />
                <SummaryMetric
                  label={patternUpProbLabel(forecast)}
                  value={formatPatternPercent(forecast.upProb)}
                />
                <SummaryMetric
                  label="Horizon"
                  value={`${forecast.horizonDays} sessions`}
                />
              </>
            ) : showUpsell ? (
              <SummaryMetric
                label="5D Alpha"
                value="Pro feature"
                subValue={PRO_FEATURE_LABELS.patternTrend.description}
              />
            ) : (
              <SummaryMetric
                label="Trend"
                value="Unavailable"
                subValue={patternGap ? unavailableReason : undefined}
              />
            )}
          </div>

          {chartHeadline || patternLine ? (
            <div className="border border-border bg-background/40 px-3 py-3">
              {chartHeadline ? (
                <p className="text-sm font-semibold text-foreground">
                  Chart structure: {chartHeadline}
                </p>
              ) : null}
              {patternLine ? (
                <p className="mt-1 text-xs text-muted">{patternLine}</p>
              ) : null}
              {chartSummary?.outlook.expectation ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {chartSummary.outlook.expectation}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </ResearchSectionCard>
    );
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {showForecast ? (
        <PatternTrendForecastCard forecast={forecast} symbol={symbol} />
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
        <ResearchSectionCard title="Price structure evidence" icon={Sparkles}>
          <p className="text-sm text-muted">
            Chart structure summary is not available for this symbol yet.
          </p>
        </ResearchSectionCard>
      ) : null}
    </div>
  );
}
