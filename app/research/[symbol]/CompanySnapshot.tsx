"use client";

import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
} from "lucide-react";
import Link from "next/link";
import { usePortfolioContext } from "@/app/contextSelectors";
import { AssetTypeBadge } from "@/components/AssetTypeBadge";
import { StrategySymbolBadge } from "@/components/StrategySymbolBadge";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { iconButtonClass } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { WatchlistButton } from "@/components/WatchlistButton";
import { quoteFreshnessLabel } from "@/lib/researchSnapshot";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { useResearchSymbolHeader } from "./ResearchSymbolHeaderContext";

type Props = { symbol: string; compact?: boolean };

export function CompanySnapshot({ symbol, compact = false }: Props) {
  const { positionMap } = usePortfolioContext();
  const upperSymbol = symbol.toUpperCase();
  const userPositions = positionMap[upperSymbol];

  const { snapshot, isLoading, error } = useResearchSymbolHeader();
  const { assetType, isEtf } = useResearchAssetTypeContext();
  const researchLabel = isEtf ? "ETF research" : "Stock research";

  if (isLoading) {
    if (compact) {
      return (
        <header className="flex items-center justify-between gap-3" aria-hidden>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </header>
      );
    }

    return (
      <header
        className="flex flex-col gap-4 py-2 md:flex-row md:items-end md:justify-between"
        aria-hidden
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-16 w-56" />
      </header>
    );
  }

  if (error || !snapshot) {
    return (
      <header>
        <ErrorBanner
          message={error ?? "Could not load snapshot for this symbol."}
        />
      </header>
    );
  }

  const positiveChange = snapshot.changePct >= 0;
  const freshness = quoteFreshnessLabel(snapshot);
  if (compact) {
    return (
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/research"
            className={cn(iconButtonClass, "h-7 w-7 md:hidden")}
            aria-label="Back to search"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {snapshot.symbol}
              <span className="hidden font-normal text-muted sm:inline">
                {" "}
                · {snapshot.name}
              </span>
            </p>
            {assetType ? (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <AssetTypeBadge assetType={assetType} />
                <StrategySymbolBadge symbol={upperSymbol} />
              </div>
            ) : (
              <StrategySymbolBadge symbol={upperSymbol} className="mt-1" />
            )}
          </div>
          {userPositions?.length ? (
            <Link
              href={symbolHubPath(upperSymbol, "position")}
              className="hidden shrink-0 border-b border-border pb-0.5 text-[10px] font-medium text-muted transition hover:text-foreground sm:inline-flex"
            >
              Your position
            </Link>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <WatchlistButton symbol={upperSymbol} iconOnly />
          <div className="flex items-baseline gap-2 text-sm">
            <div className="text-right">
              <span className="font-semibold tabular-nums">
                ${snapshot.price.toLocaleString()}
              </span>
              <span
                className={cn(
                  "ml-2 inline-flex items-center gap-0.5 text-xs font-medium",
                  positiveChange ? "text-success" : "text-danger",
                )}
              >
                {positiveChange ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                <span className="tabular-nums">
                  {positiveChange ? "+" : ""}
                  {snapshot.changePct.toFixed(2)}%
                </span>
              </span>
              <p className="mt-0.5 text-[10px] font-medium text-muted">
                {freshness}
              </p>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="flex flex-col gap-4 py-2 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 max-w-full space-y-1.5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          {researchLabel}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
            {snapshot.symbol} · {snapshot.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {assetType ? <AssetTypeBadge assetType={assetType} /> : null}
            <StrategySymbolBadge symbol={upperSymbol} />
          </div>
          {userPositions?.length ? (
            <Link
              href={symbolHubPath(upperSymbol, "position")}
              className="inline-flex items-center gap-1.5 border-b border-border pb-0.5 text-[11px] font-medium text-muted transition hover:text-foreground"
            >
              <BriefcaseBusiness className="h-3 w-3" aria-hidden="true" />
              Your position
            </Link>
          ) : null}
          <WatchlistButton symbol={upperSymbol} />
        </div>
      </div>

      <div className="shrink-0 text-sm md:text-right">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-2xl font-semibold tabular-nums">
            ${snapshot.price.toLocaleString()}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              positiveChange ? "text-success" : "text-danger",
            )}
          >
            {positiveChange ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span className="tabular-nums">
              {positiveChange ? "+" : ""}
              {snapshot.changePct.toFixed(2)}%
            </span>
          </span>
        </div>
        <p className="mt-1 text-[11px] font-medium text-muted">{freshness}</p>
      </div>
    </header>
  );
}
