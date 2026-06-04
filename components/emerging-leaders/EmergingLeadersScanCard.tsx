"use client";

import type { EmergingLeadersResponse } from "@/app/types/emergingLeaders";
import {
  moversMetaBodyClass,
  moversMetaCardClass,
  moversMetaEyebrowClass,
  moversMetaInsetClass,
  moversMetaTitleClass,
} from "@/lib/moversUi";
import { cn } from "@/lib/utils";

type Props = {
  data: EmergingLeadersResponse;
  className?: string;
};

export function EmergingLeadersScanCard({ data, className }: Props) {
  const asOf = data.asOfDate
    ? `Ranking as of ${data.asOfDate}`
    : "Latest universe scan";

  return (
    <section
      className={cn(moversMetaCardClass, className)}
      aria-label="Setup scan"
    >
      <p className={moversMetaEyebrowClass}>Setup scan</p>
      <h2 className={moversMetaTitleClass}>Pre-breakout universe filter</h2>
      <p className={moversMetaBodyClass}>
        Scores symbols with OHLCV on disk. Excludes current Top Movers so this
        list stays complementary, not duplicate leadership.
      </p>
      <dl
        className={cn(
          moversMetaInsetClass,
          "grid gap-2 text-xs sm:grid-cols-2",
        )}
      >
        <div>
          <dt className="text-muted">Candidates scanned</dt>
          <dd className="font-mono font-semibold text-foreground">
            {data.universeScanned}
          </dd>
        </div>
        <div>
          <dt className="text-muted">With OHLCV data</dt>
          <dd className="font-mono font-semibold text-foreground">
            {data.symbolsWithData}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Setups evaluated</dt>
          <dd className="font-mono font-semibold text-foreground">
            {data.evaluationsComputed}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Top movers excluded</dt>
          <dd className="font-mono font-semibold text-foreground">
            {data.excludedTopMovers}
          </dd>
        </div>
      </dl>
      <p className="text-[11px] text-muted">{asOf}</p>
    </section>
  );
}
