"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import type { OwnershipSnapshot, StreetAnalysisSnapshot } from "@/app/hooks/streetAnalysisTypes";
import {
  formatHolderShares,
  formatInstitutionalHolderShares,
  yahooEstimatesAttribution,
  formatCompactNumber,
  formatPctHeld,
  formatRatingActionDate,
  hasOwnership,
} from "@/lib/streetAnalysisUtils";
import { cn } from "@/lib/utils";
import { ResearchSectionSkeleton } from "@/components/ui/Skeleton";

const INSIDER_TRANSACTION_PREVIEW = 5;

/** Fixed columns: date · insider · transaction · shares · value */
const INSIDER_TX_GRID =
  "grid grid-cols-[6.25rem_minmax(0,1fr)_minmax(0,1.15fr)_4.25rem_4.75rem] items-start gap-x-2 gap-y-0.5";

type StreetOwnershipSectionProps = {
  ownership: OwnershipSnapshot | null | undefined;
  dataAsOf?: string | null;
  isLoading?: boolean;
};

export function StreetOwnershipSkeleton() {
  return (
    <ResearchSectionSkeleton
      headerWidth="w-40"
      rows={1}
      rowClassName="h-20 rounded-lg"
    />
  );
}

export function StreetOwnershipSection({
  ownership,
  dataAsOf,
  isLoading,
}: StreetOwnershipSectionProps) {
  if (isLoading) {
    return <StreetOwnershipSkeleton />;
  }

  if (!hasOwnership(ownership)) {
    return (
      <p className="text-sm text-muted">
        Ownership and insider activity aren&apos;t available for this symbol.
      </p>
    );
  }

  const holders = ownership?.topInstitutional ?? [];
  const insiders = ownership?.recentInsiderTransactions ?? [];
  const [showAllInsiderTx, setShowAllInsiderTx] = useState(false);
  const hasMoreInsiderTx = insiders.length > INSIDER_TRANSACTION_PREVIEW;
  const visibleInsiderTx =
    showAllInsiderTx || !hasMoreInsiderTx
      ? insiders
      : insiders.slice(0, INSIDER_TRANSACTION_PREVIEW);

  return (
    <div className="app-stack">
      {(ownership?.insidersPctHeld != null ||
        ownership?.institutionsPctHeld != null) && (
        <div className="grid grid-cols-2 gap-2">
          {ownership?.insidersPctHeld != null ? (
            <div className="rounded-lg border border-border bg-background/60 px-2.5 py-2">
              <p className="text-[10px] text-muted">Insiders</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatPctHeld(ownership.insidersPctHeld)}
              </p>
            </div>
          ) : null}
          {ownership?.institutionsPctHeld != null ? (
            <div className="rounded-lg border border-border bg-background/60 px-2.5 py-2">
              <p className="text-[10px] text-muted">Institutions</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatPctHeld(ownership.institutionsPctHeld)}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {holders.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Top institutional holders
          </p>
          <ul className="space-y-1.5">
            {holders.map((row) => (
              <li
                key={row.holder}
                className="flex items-baseline justify-between gap-2 text-xs"
              >
                <span className="min-w-0 truncate text-foreground">{row.holder}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  {row.pctHeld != null ? formatPctHeld(row.pctHeld) : ""}
                  {row.shares != null
                    ? ` · ${formatInstitutionalHolderShares(row.shares)}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {insiders.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Insider transactions ({insiders.length})
          </p>
          <div
            className={cn(
              "space-y-1.5 text-xs leading-snug",
              showAllInsiderTx &&
                insiders.length > 12 &&
                "max-h-80 overflow-y-auto pr-1",
            )}
          >
              <div
                className={cn(
                  INSIDER_TX_GRID,
                  "border-b border-border pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted",
                )}
              >
                <span>Date</span>
                <span>Insider</span>
                <span>Transaction</span>
                <span className="text-right">Shares</span>
                <span className="text-right">Value</span>
              </div>
              <ul className="space-y-1.5">
                {visibleInsiderTx.map((row, index) => (
                  <li
                    key={`${row.date}-${row.insider}-${row.transaction ?? ""}-${index}`}
                    className={INSIDER_TX_GRID}
                  >
                    <span className="shrink-0 tabular-nums text-muted">
                      {formatRatingActionDate(row.date)}
                    </span>
                    <span className="min-w-0 break-words font-medium text-foreground">
                      {row.insider}
                    </span>
                    <span className="min-w-0 break-words text-muted">
                      {row.transaction ?? "—"}
                    </span>
                    <span className="text-right tabular-nums text-muted">
                      {row.shares != null ? formatHolderShares(row.shares) : "—"}
                    </span>
                    <span className="text-right tabular-nums text-muted">
                      {row.value != null ? formatCompactNumber(row.value) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
          </div>
          {hasMoreInsiderTx ? (
            <button
              type="button"
              onClick={() => setShowAllInsiderTx((open) => !open)}
              className="text-[11px] font-medium text-accent-strong transition hover:underline"
            >
              {showAllInsiderTx
                ? "Show fewer"
                : `View all ${insiders.length} transactions`}
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="text-[11px] text-muted">
        {yahooEstimatesAttribution(dataAsOf)}
      </p>
    </div>
  );
}

export function hasStreetOwnership(
  street: StreetAnalysisSnapshot | null | undefined,
): boolean {
  return hasOwnership(street?.ownership);
}
