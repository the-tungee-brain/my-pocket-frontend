"use client";

import { usePerformanceSnapshot } from "@/app/hooks/usePerformance";
import { useStreetAnalysis } from "@/app/hooks/useStreetAnalysis";
import { useTraderPlaybook } from "@/app/hooks/useTraderPlaybook";
import type { SymbolIntelligence } from "@/app/types/intelligence";
import type { TraderPlaybookResponse } from "@/app/types/research";
import {
  ResearchRow,
  ResearchSection,
} from "@/components/research/ResearchMemoPrimitives";
import {
  formatPatternPercent,
  patternDirectionLabel,
  patternDirectionSubtitle,
  patternUpProbLabel,
} from "@/lib/patternForecast";
import {
  hasChartAnalystSummary,
  hasPatternIntelligence,
  outlookHeadline,
  patternIntelligencePatternSubtitle,
  patternIntelligencePrimaryPattern,
} from "@/lib/patternIntelligence";
import {
  formatPremiumDiscountToTarget,
  formatStreetPrice,
  hasStreetAnalysis,
} from "@/lib/streetAnalysisUtils";
import { symbolHubPath } from "@/lib/symbolRoutes";

type Props = {
  symbol: string;
  accessToken?: string;
  intelligence: SymbolIntelligence | null;
  intelligenceLoading?: boolean;
  isEtf?: boolean;
  className?: string;
};

function truncateSentence(value: string, max = 145): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function priceStructureSummary(
  intelligence: SymbolIntelligence | null,
  traderPlaybook: TraderPlaybookResponse | null,
) {
  if (
    traderPlaybook?.bestSetup === "FailedBreakout" &&
    (traderPlaybook.status === "NoSetup" ||
      traderPlaybook.status === "Invalid" ||
      traderPlaybook.side === "NoTrade")
  ) {
    return {
      status: "Failed breakout risk",
      description:
        traderPlaybook.warnings[0] ??
        traderPlaybook.reasons[0] ??
        "The chart trend is not confirming a clean long setup.",
    };
  }

  const patternIntel = intelligence?.patternIntelligence;
  const chartIntelligence = patternIntel?.chartIntelligence;
  if (
    patternIntel &&
    chartIntelligence &&
    hasPatternIntelligence(patternIntel) &&
    hasChartAnalystSummary(chartIntelligence)
  ) {
    const summary = chartIntelligence.summary;
    const primaryPattern = patternIntelligencePrimaryPattern(patternIntel);
    const patternLine = primaryPattern
      ? `${primaryPattern.label} · ${patternIntelligencePatternSubtitle(primaryPattern)}`
      : null;
    return {
      status: outlookHeadline(summary.outlook),
      description:
        patternLine ??
        summary.outlook.expectation ??
        "Chart trend evidence is available in Analysis.",
    };
  }
  return {
    status: "Unavailable",
    description: "Chart trend evidence is not available for this symbol yet.",
  };
}

function relativeStrengthSummary(intelligence: SymbolIntelligence | null) {
  const forecast = intelligence?.patternForecast;
  if (forecast) {
    const subtitle = patternDirectionSubtitle(forecast).replace(/[.。]+$/, "");
    return {
      status: patternDirectionLabel(forecast),
      description: `${subtitle}. ${patternUpProbLabel(
        forecast,
      )}: ${formatPatternPercent(forecast.upProb)} over ${forecast.horizonDays} sessions.`,
    };
  }
  return {
    status: "Unavailable",
    description: "Market-strength data is not available for this symbol yet.",
  };
}

export function ResearchOverviewEvidence({
  symbol,
  accessToken,
  intelligence,
  intelligenceLoading = false,
  isEtf = false,
  className,
}: Props) {
  const {
    performance: perf,
    isLoading: performanceLoading,
    error: performanceError,
  } = usePerformanceSnapshot(symbol, { accessToken });
  const {
    street,
    isLoading: streetLoading,
    error: streetError,
  } = useStreetAnalysis(symbol, {
    accessToken,
    enabled: !isEtf,
  });
  const { traderPlaybook } = useTraderPlaybook(symbol, accessToken, {
    enabled: !isEtf,
  });

  const priceStructure = priceStructureSummary(intelligence, traderPlaybook);
  const relativeStrength = relativeStrengthSummary(intelligence);
  const streetTargets = street?.priceTargets;
  const latestRating = street?.recentRatingActions?.[0];
  const targetLine =
    streetTargets?.mean != null
      ? [
          `Mean target ${formatStreetPrice(streetTargets.mean)}`,
          streetTargets?.upsideToMeanPct != null
            ? formatPremiumDiscountToTarget(
                streetTargets.current,
                streetTargets.mean,
                streetTargets.upsideToMeanPct,
              )
            : null,
        ]
          .filter(Boolean)
          .join(", ")
      : null;

  return (
    <ResearchSection title="Evidence" className={className}>
      <div className="divide-y divide-border/60">
        <ResearchRow
          label="Chart trend"
          status={priceStructure.status}
          body={truncateSentence(priceStructure.description)}
          href={symbolHubPath(symbol, "analysis")}
          loading={intelligenceLoading && !intelligence}
        />
        <ResearchRow
          label="Market strength"
          status={relativeStrength.status}
          body={truncateSentence(relativeStrength.description)}
          href={symbolHubPath(symbol, "analysis")}
          loading={intelligenceLoading && !intelligence}
        />
        {!isEtf ? (
          <ResearchRow
            label="Analyst view"
            status={
              hasStreetAnalysis(street)
                ? (street.consensusLabel ?? "Analyst context available")
                : "Unavailable"
            }
            body={
              hasStreetAnalysis(street)
                ? [
                    targetLine,
                    latestRating
                      ? `Latest: ${latestRating.firm} ${
                          latestRating.fromGrade
                            ? `${latestRating.fromGrade} to ${latestRating.toGrade}`
                            : latestRating.toGrade
                        }`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "External analyst consensus and target context are not available."
            }
            href={symbolHubPath(symbol, "fundamentals")}
            loading={streetLoading}
            error={streetError}
          />
        ) : null}
        <ResearchRow
          label="Performance"
          status={perf?.trendLabel ?? "Unavailable"}
          body={perf?.volatilityNote ?? "Recent performance is not available."}
          loading={performanceLoading && !perf}
          error={performanceError}
        />
      </div>
    </ResearchSection>
  );
}
