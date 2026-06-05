"use client";

import { useMemo, useState } from "react";
import type { MomentumBreakoutScanResponse } from "@/app/types/momentumBreakoutScan";
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
import {
  mbHeroShellClass,
  mbOpportunityCardApprovedClass,
  mbOpportunityCardClass,
  mbSectionLabelClass,
  mbStatTileClass,
  mbStatusPillClass,
} from "@/lib/momentumBreakoutUi";
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

function HeroStatTile({
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
        mbStatTileClass,
        highlight && "border-success/30 bg-success/[0.06]",
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
      <p className="mt-0.5 text-xs leading-snug text-muted">{label}</p>
    </div>
  );
}

function TrackRecordMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 text-base font-semibold tabular-nums text-foreground">
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

  const heroTone =
    hero.tone === "favorable"
      ? "favorable"
      : hero.tone === "cautious"
        ? "cautious"
        : "neutral";

  return (
    <div className={cn("space-y-6", className)}>
      <div
        className={cn(
          "rounded-lg px-4 py-5 sm:px-5 sm:py-6",
          mbHeroShellClass(heroTone),
        )}
      >
        <p className={mbSectionLabelClass}>Today&apos;s verdict</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {hero.title}
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          {hero.body}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <HeroStatTile
            value={hero.stocksScanned}
            label={
              hero.stocksScanned === 1 ? "Stock scanned" : "Stocks scanned"
            }
          />
          <HeroStatTile
            value={hero.opportunitiesReviewed}
            label={
              hero.opportunitiesReviewed === 1
                ? "Opportunity reviewed"
                : "Opportunities reviewed"
            }
          />
          <HeroStatTile value={hero.opportunitiesRejected} label="Rejected" />
          <HeroStatTile
            value={hero.opportunitiesApproved}
            label="Approved"
            highlight={hero.opportunitiesApproved > 0}
          />
        </div>

        <p className="mt-4 text-xs text-muted">
          {marketScanLabel ? (
            <>
              Last scan{" "}
              <span className="font-medium text-foreground/80">
                {marketScanLabel}
              </span>
            </>
          ) : (
            "Scans run during market hours."
          )}
        </p>
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>

      {trackDisplay && (
        <section aria-label="Strategy track record">
          <h3 className={mbSectionLabelClass}>Strategy track record</h3>
          <dl className="mt-3 flex flex-col gap-2 sm:flex-row">
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
          <p className="mt-2 text-xs text-muted">
            Historical pattern research only. Future results may differ.
          </p>
        </section>
      )}

      {!loading && !error && tradable.length > 0 && (
        <section aria-label="Tradable opportunities">
          <h3 className={mbSectionLabelClass}>Tradable opportunities</h3>
          <ul className="mt-3 space-y-2">
            {tradable.slice(0, 8).map((c) => {
              const alreadyTracked = trackedSymbols?.has(
                c.symbol.toUpperCase(),
              );
              return (
                <li key={c.symbol} className={mbOpportunityCardApprovedClass}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-base font-semibold text-foreground">
                      {c.symbol}
                    </span>
                    <span className={mbStatusPillClass("approved")}>
                      Approved
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
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
                      className="mt-3 w-full"
                      onClick={() => onTrackPlan(c.symbol)}
                    >
                      {alreadyTracked ? "View on watchlist" : "Track this plan"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!loading && !error && (
        <section aria-label="Rejected opportunities">
          <h3 className={mbSectionLabelClass}>Rejected opportunities</h3>
          {blocked.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No rejected opportunities in the latest scan window.
            </p>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {visibleRejected.map((c) => {
                  const reasons = explainRejectedOpportunity(c);
                  const primary = reasons[0];
                  const extra = reasons.slice(1);
                  return (
                    <li key={c.symbol} className={mbOpportunityCardClass}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {c.symbol}
                        </span>
                        <span className={mbStatusPillClass("rejected")}>
                          Rejected
                        </span>
                      </div>
                      {primary && (
                        <p className="mt-1.5 text-sm text-foreground/85">
                          {primary}
                        </p>
                      )}
                      {extra.length > 0 && (
                        <ul className="mt-1 list-inside list-disc text-xs text-muted">
                          {extra.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
              {blocked.length > REJECTED_PREVIEW_COUNT && (
                <button
                  type="button"
                  className="mt-3 text-sm font-medium text-accent-strong hover:underline"
                  onClick={() => setRejectedExpanded((open) => !open)}
                >
                  {rejectedExpanded
                    ? "Show fewer"
                    : `Show all ${blocked.length} rejected`}
                </button>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
