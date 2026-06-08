"use client";

import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  GitCompareArrows,
  Minus,
  Plus,
} from "lucide-react";
import type { PortfolioChanges } from "@/app/types/intelligence";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { SkeletonList } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type Props = {
  changes: PortfolioChanges | null | undefined;
  loading?: boolean;
  className?: string;
};

export function formatPortfolioChangePct(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

export function hasPortfolioChangeDetails(
  changes: PortfolioChanges | null | undefined,
) {
  if (!changes) return false;

  return (
    (changes.newSymbols?.length ?? 0) > 0 ||
    (changes.removedSymbols?.length ?? 0) > 0 ||
    (changes.weightChanges?.length ?? 0) > 0 ||
    changes.liquidationValueChangePct != null
  );
}

function SectionShell({
  summary,
  children,
  className,
}: {
  summary?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className} aria-label="Portfolio changes">
      <CardHeader>
        <CardTitle
          title="Since yesterday"
          description={
            summary ??
            "Day-over-day changes in holdings, weights, and portfolio value"
          }
          icon={
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-accent-muted text-accent-strong">
              <GitCompareArrows className="h-4 w-4" aria-hidden />
            </div>
          }
        />
      </CardHeader>
      {children}
    </Card>
  );
}

function ChangesEmptyState() {
  return (
    <div className="px-4 py-4">
      <div className="border border-dashed border-border bg-background/40 px-4 py-8 text-center">
        <GitCompareArrows
          className="mx-auto mb-2.5 h-5 w-5 text-muted"
          aria-hidden
        />
        <p className="text-sm font-medium text-foreground">
          No changes since yesterday
        </p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
          Your holdings and portfolio weights match the previous snapshot.
        </p>
      </div>
    </div>
  );
}

function ChangesSkeleton() {
  return (
    <SkeletonList
      rows={2}
      rowClassName="h-12 rounded-xl"
      className="px-4 py-4"
    />
  );
}

export function PortfolioChangesBody({
  changes,
}: {
  changes: PortfolioChanges | null | undefined;
}) {
  if (!hasPortfolioChangeDetails(changes)) {
    return <ChangesEmptyState />;
  }

  return (
    <div className="space-y-3">
      {changes?.liquidationValueChangePct != null && (
        <div className="flex items-center gap-2 border border-border bg-background/60 px-3 py-2.5">
          {changes.liquidationValueChangePct >= 0 ? (
            <ArrowUpRight className="h-4 w-4 text-emerald-600" aria-hidden />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-danger" aria-hidden />
          )}
          <span className="text-sm text-foreground">
            Portfolio value{" "}
            <span className="font-semibold tabular-nums">
              {formatPortfolioChangePct(changes.liquidationValueChangePct)}
            </span>
          </span>
        </div>
      )}

      {(changes?.newSymbols?.length ?? 0) > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Added
          </p>
          <div className="flex flex-wrap gap-2">
            {changes!.newSymbols.map((symbol) => (
              <span
                key={symbol}
                className="border border-border bg-background px-3 py-1 font-mono text-[11px]"
              >
                {symbol}
              </span>
            ))}
          </div>
        </div>
      )}

      {(changes?.removedSymbols?.length ?? 0) > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            <Minus className="h-3.5 w-3.5" aria-hidden />
            Removed
          </p>
          <div className="flex flex-wrap gap-2">
            {changes!.removedSymbols.map((symbol) => (
              <span
                key={symbol}
                className="border border-border bg-background px-3 py-1 font-mono text-[11px]"
              >
                {symbol}
              </span>
            ))}
          </div>
        </div>
      )}

      {(changes?.weightChanges?.length ?? 0) > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
            Largest weight shifts
          </p>
          <ul className="space-y-2">
            {changes!.weightChanges.slice(0, 4).map((item) => (
              <li
                key={item.symbol}
                className="flex items-center justify-between gap-3 border border-border bg-background/60 px-3 py-2"
              >
                <span className="font-mono text-sm font-medium">
                  {item.symbol}
                </span>
                <span className="text-xs tabular-nums text-muted">
                  {item.previousWeightPct.toFixed(1)}% →{" "}
                  {item.currentWeightPct.toFixed(1)}%
                  <span
                    className={cn(
                      "ml-2 font-semibold",
                      item.changePct >= 0 ? "text-emerald-600" : "text-danger",
                    )}
                  >
                    {formatPortfolioChangePct(item.changePct)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PortfolioChangesSection({
  changes,
  loading = false,
  className,
}: Props) {
  if (loading) {
    return (
      <SectionShell className={className}>
        <ChangesSkeleton />
      </SectionShell>
    );
  }

  return (
    <SectionShell className={className} summary={changes?.summary}>
      <CardBody className="py-4">
        <PortfolioChangesBody changes={changes} />
      </CardBody>
    </SectionShell>
  );
}
