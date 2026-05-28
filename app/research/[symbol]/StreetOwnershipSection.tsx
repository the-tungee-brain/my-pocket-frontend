"use client";

import { Users } from "lucide-react";
import type { OwnershipSnapshot, StreetAnalysisSnapshot } from "@/app/hooks/streetAnalysisTypes";
import {
  ANALYST_DATA_ATTRIBUTION,
  formatHolderShares,
  formatPctHeld,
  formatRatingActionDate,
  hasOwnership,
} from "@/lib/streetAnalysisUtils";
import { cn } from "@/lib/utils";

type StreetOwnershipSectionProps = {
  ownership: OwnershipSnapshot | null | undefined;
  isLoading?: boolean;
};

export function StreetOwnershipSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-40 animate-pulse rounded bg-muted-bg" />
      <div className="h-20 animate-pulse rounded-lg bg-muted-bg" />
    </div>
  );
}

export function StreetOwnershipSection({
  ownership,
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

  return (
    <div className="space-y-4">
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
                    ? ` · ${formatHolderShares(row.shares)}`
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
            Recent insider transactions
          </p>
          <ul className="space-y-1.5">
            {insiders.map((row) => (
              <li
                key={`${row.date}-${row.insider}-${row.transaction}`}
                className="flex gap-2 text-xs leading-snug"
              >
                <span className="shrink-0 tabular-nums text-muted">
                  {formatRatingActionDate(row.date)}
                </span>
                <span className="min-w-0 text-foreground">
                  <span className="font-medium">{row.insider}</span>
                  {row.transaction ? (
                    <span className={cn("text-muted")}> · {row.transaction}</span>
                  ) : null}
                  {row.shares != null ? (
                    <span className="text-muted">
                      {" "}
                      · {formatHolderShares(row.shares)}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-[11px] text-muted">{ANALYST_DATA_ATTRIBUTION}</p>
    </div>
  );
}

export function hasStreetOwnership(
  street: StreetAnalysisSnapshot | null | undefined,
): boolean {
  return hasOwnership(street?.ownership);
}
