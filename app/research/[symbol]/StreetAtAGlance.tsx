"use client";

import Link from "next/link";
import { ChevronRight, Target } from "lucide-react";
import { useSession } from "next-auth/react";
import { useStreetAnalysis } from "@/app/hooks/useStreetAnalysis";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { symbolHubPath } from "@/lib/symbolRoutes";
import {
  formatStreetPrice,
  formatStreetUpside,
  hasStreetAnalysis,
} from "@/lib/streetAnalysisUtils";
import { cn } from "@/lib/utils";
import { StreetAnalysisSkeleton } from "./StreetAnalysisSection";

type StreetAtAGlanceProps = {
  symbol: string;
};

export function StreetAtAGlance({ symbol }: StreetAtAGlanceProps) {
  const { data: session } = useSession();
  const { isEtf } = useResearchAssetTypeContext();
  const { street, isLoading, error } = useStreetAnalysis(symbol, {
    accessToken: session?.accessToken,
    enabled: !isEtf,
  });

  if (isEtf) return null;

  const fundamentalsHref = symbolHubPath(symbol, "fundamentals");

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-secondary/50 px-4 py-3">
        <StreetAnalysisSkeleton compact />
      </div>
    );
  }

  if (error || !hasStreetAnalysis(street)) {
    return null;
  }

  const targets = street.priceTargets;
  const mean = targets?.mean;

  return (
    <div className="rounded-xl border border-border bg-secondary/50 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-accent-strong" aria-hidden />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Street at a glance
          </h3>
        </div>
        <Link
          href={fundamentalsHref}
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-accent-strong transition hover:underline"
        >
          Full consensus
          <ChevronRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
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
        <p className="mt-1.5 text-xs text-muted">
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

      {street.estimateRevisionHeadline ? (
        <p className="mt-2 text-xs leading-relaxed text-foreground">
          {street.estimateRevisionHeadline}
        </p>
      ) : null}

      <p className="mt-2 text-[10px] text-muted">Yahoo Finance street estimates.</p>
    </div>
  );
}
