"use client";

import type { MomentumBreakoutScanResponse } from "@/app/types/momentumBreakoutScan";
import {
  moversMetaBodyClass,
  moversMetaCardClass,
  moversMetaEyebrowClass,
  moversMetaInsetClass,
  moversMetaTitleClass,
} from "@/lib/moversUi";
import { cn } from "@/lib/utils";

type Props = {
  scan: MomentumBreakoutScanResponse | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
};

export function MomentumBreakoutScanSummary({
  scan,
  loading = false,
  error = null,
  className,
}: Props) {
  return (
    <section
      className={cn(moversMetaCardClass, className)}
      aria-label="Momentum Breakout scanner"
    >
      <p className={moversMetaEyebrowClass}>Setup scanner</p>
      <h2 className={moversMetaTitleClass}>Valid setups vs tradable alerts</h2>
      <p className={moversMetaBodyClass}>
        Valid setups pass Momentum Breakout rules on the latest bar. Tradable
        alerts also pass risk gate and quality filters (not persisted
        automatically).
      </p>

      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      {loading && !scan && (
        <p className="text-xs text-muted">Scanning universe…</p>
      )}

      {scan && (
        <dl
          className={cn(
            moversMetaInsetClass,
            "grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4",
          )}
        >
          <div>
            <dt className="text-muted">Symbols scanned</dt>
            <dd className="font-mono font-semibold text-foreground">
              {scan.totalSymbolsScanned}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Valid setups</dt>
            <dd className="font-mono font-semibold text-foreground">
              {scan.validSetupsFound}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Tradable alerts</dt>
            <dd className="font-mono font-semibold text-foreground">
              {scan.tradableCandidatesFound}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Blocked by filters</dt>
            <dd className="font-mono font-semibold text-foreground">
              {scan.blockedCandidatesCount}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
