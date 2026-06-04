"use client";

import { useMemo, useState } from "react";
import type { MomentumBreakoutScanResponse } from "@/app/types/momentumBreakoutScan";
import type { StrategyTrackRecord } from "@/lib/momentumBreakoutInvestorUi";
import {
  buildHeroVerdict,
  deriveStrategyTrackRecord,
  explainRejectedOpportunity,
  formatRegimeForInvestors,
  formatScanTimestamp,
  formatTrackRecordDisplay,
  partitionScanCandidates,
} from "@/lib/momentumBreakoutInvestorUi";
import { formatUsdLevel } from "@/lib/momentumBreakoutAlertUi";
import type { PaperTradeSummary } from "@/app/types/momentumBreakoutPaperPerformance";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const REJECTED_PREVIEW_COUNT = 3;

type Props = {
  scan: MomentumBreakoutScanResponse | null;
  paperSummary?: PaperTradeSummary | null;
  loading?: boolean;
  error?: string | null;
  trackedSymbols?: ReadonlySet<string>;
  onTrackPlan?: (symbol: string) => void;
  className?: string;
};

function heroToneClass(tone: string): string {
  switch (tone) {
    case "favorable":
      return "border-success/30 bg-gradient-to-b from-success/10 to-surface";
    case "cautious":
      return "border-warning/35 bg-gradient-to-b from-warning-muted/50 to-surface";
    default:
      return "border-border bg-gradient-to-b from-muted-bg/50 to-surface";
  }
}

function verdictBadgeClass(kind: string): string {
  switch (kind) {
    case "Approved":
      return "text-success";
    case "Caution":
      return "text-amber-800 dark:text-amber-200";
    case "Rejected":
      return "text-danger";
    case "Completed":
      return "text-foreground/70";
    default:
      return "text-foreground";
  }
}

function HeroStatChip({
  value,
  label,
  highlight = false,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        highlight
          ? "border-success/35 bg-success/10"
          : "border-border/80 bg-background/50",
      )}
    >
      <p
        className={cn(
          "text-xl font-bold tabular-nums tracking-tight sm:text-2xl",
          highlight ? "text-success" : "text-foreground",
        )}
      >
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-[13px] leading-snug text-foreground/80">
        {label}
      </p>
    </div>
  );
}

function TrackRecordMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 sm:flex-1">
      <dt className="text-[13px] font-medium text-foreground/75">{label}</dt>
      <dd className="mt-1 text-[17px] font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

export function MomentumBreakoutInvestorBrief({
  scan,
  paperSummary = null,
  loading = false,
  error = null,
  trackedSymbols,
  onTrackPlan,
  className,
}: Props) {
  const [rejectedExpanded, setRejectedExpanded] = useState(false);

  const { tradable, blocked } = useMemo(
    () => partitionScanCandidates(scan),
    [scan],
  );
  const hero = useMemo(
    () => buildHeroVerdict(scan, tradable, blocked, loading),
    [scan, tradable, blocked, loading],
  );
  const trackRecord = useMemo(
    () => deriveStrategyTrackRecord(paperSummary, scan),
    [paperSummary, scan],
  );
  const trackDisplay = trackRecord
    ? formatTrackRecordDisplay(trackRecord)
    : null;

  const marketScanLabel = formatScanTimestamp(scan?.scanTime);
  const visibleRejected = rejectedExpanded
    ? blocked
    : blocked.slice(0, REJECTED_PREVIEW_COUNT);

  return (
    <div className={cn("space-y-4", className)}>
      <section
        className={cn(
          "rounded-2xl border px-5 py-6 shadow-sm",
          heroToneClass(hero.tone),
        )}
        aria-label="Today's verdict"
      >
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {hero.title}
        </h2>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-foreground/80">
          {hero.body}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <HeroStatChip
            value={hero.stocksScanned}
            label={
              hero.stocksScanned === 1 ? "Stock scanned" : "Stocks scanned"
            }
          />
          <HeroStatChip
            value={hero.opportunitiesReviewed}
            label={
              hero.opportunitiesReviewed === 1
                ? "Opportunity reviewed"
                : "Opportunities reviewed"
            }
          />
          <HeroStatChip
            value={hero.opportunitiesRejected}
            label={
              hero.opportunitiesRejected === 1
                ? "Opportunity rejected"
                : "Opportunities rejected"
            }
          />
          {hero.opportunitiesApproved > 0 && (
            <HeroStatChip
              value={hero.opportunitiesApproved}
              label={
                hero.opportunitiesApproved === 1
                  ? "Opportunity approved"
                  : "Opportunities approved"
              }
              highlight
            />
          )}
        </div>

        <p className="mt-5 text-[13px] leading-relaxed text-foreground/75">
          We continue scanning automatically during market hours.
          {marketScanLabel ? (
            <>
              {" "}
              <span className="font-medium text-foreground">
                Market scan: {marketScanLabel}
              </span>
            </>
          ) : null}
        </p>
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </section>

      {trackDisplay && (
        <section
          className="rounded-xl border border-border/80 bg-surface/60 px-4 py-4"
          aria-label="Strategy track record"
        >
          <h3 className="text-[15px] font-semibold text-foreground">
            Strategy Track Record
          </h3>
          <dl className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <TrackRecordMetric label="Win rate" value={trackDisplay.winRate} />
            <TrackRecordMetric
              label="Profit factor"
              value={trackDisplay.profitFactor}
            />
            <TrackRecordMetric
              label="Trades studied"
              value={trackDisplay.tradesStudied}
            />
          </dl>
          <p className="mt-3 text-[13px] leading-relaxed text-foreground/70">
            Based on historical pattern research. Future results may differ.
          </p>
        </section>
      )}

      {tradable.length > 0 && (
        <section aria-label="Tradable opportunities">
          <h3 className="text-[15px] font-semibold text-foreground">
            Tradable Opportunities
          </h3>
          <p className="mt-1 text-[13px] text-foreground/75">
            Passed quality and risk checks. Tap Track this plan to jump to your
            watchlist.
          </p>
          <ul className="mt-2 space-y-2">
            {tradable.slice(0, 8).map((c) => {
              const alreadyTracked = trackedSymbols?.has(
                c.symbol.toUpperCase(),
              );
              return (
                <li
                  key={c.symbol}
                  className="rounded-lg border border-success/25 bg-success/8 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[17px] font-bold tracking-wide text-foreground">
                      {c.symbol}
                    </span>
                    <span
                      className={cn(
                        "text-[13px] font-semibold",
                        verdictBadgeClass("Approved"),
                      )}
                    >
                      Approved
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-foreground/75">
                    {formatRegimeForInvestors(c.marketRegime)} · Entry{" "}
                    {formatUsdLevel(c.entryPrice)} · Stop{" "}
                    {formatUsdLevel(c.stopPrice)} · Target{" "}
                    {formatUsdLevel(c.targetPrice)}
                  </p>
                  {onTrackPlan && (
                    <Button
                      type="button"
                      variant={alreadyTracked ? "outline" : "default"}
                      size="sm"
                      className="mt-2.5 w-full sm:w-auto"
                      onClick={() => onTrackPlan(c.symbol)}
                    >
                      {alreadyTracked
                        ? "View on watchlist"
                        : "Track this plan"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-label="Rejected opportunities">
        <h3 className="text-[15px] font-semibold text-foreground">
          Rejected Opportunities
        </h3>
        <p className="mt-1 text-[13px] text-foreground/75">
          Reviewed today but did not meet our standards.
        </p>
        {blocked.length === 0 ? (
          <p className="mt-2 text-[13px] text-foreground/75">
            No rejected opportunities in the latest scan window.
          </p>
        ) : (
          <>
            <ul className="mt-2 space-y-1.5">
              {visibleRejected.map((c) => {
                const reasons = explainRejectedOpportunity(c);
                const primary = reasons[0];
                const extra = reasons.slice(1);
                return (
                  <li
                    key={c.symbol}
                    className="rounded-lg border border-border/70 bg-muted-bg/25 px-3 py-2"
                  >
                    <p className="text-[17px] font-bold text-foreground">
                      {c.symbol}
                    </p>
                    {primary && (
                      <p className="mt-1 text-[13px] text-foreground/80">
                        {primary}
                      </p>
                    )}
                    {extra.length > 0 && (
                      <ul className="mt-1 list-inside list-disc text-[13px] text-foreground/70">
                        {extra.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1.5 text-[13px] font-medium text-foreground/65">
                      No action recommended.
                    </p>
                  </li>
                );
              })}
            </ul>
            {blocked.length > REJECTED_PREVIEW_COUNT && (
              <button
                type="button"
                className="mt-2 text-[13px] font-semibold text-accent-strong hover:underline"
                onClick={() => setRejectedExpanded((open) => !open)}
              >
                {rejectedExpanded
                  ? "Show fewer"
                  : `Show all ${blocked.length} rejected opportunities`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
