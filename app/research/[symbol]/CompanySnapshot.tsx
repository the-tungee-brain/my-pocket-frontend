"use client";

import Link from "next/link";
import { useResearchSymbolHeader } from "./ResearchSymbolHeaderContext";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  ExternalLink,
  BriefcaseBusiness,
} from "lucide-react";
import { appInsetClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { WatchlistButton } from "@/components/WatchlistButton";
import { WatchlistHint } from "@/components/WatchlistHint";
import { iconButtonClass } from "@/components/ui/IconButton";
import { usePortfolioContext } from "@/app/contextSelectors";
import { CompanyLogo } from "@/components/CompanyLogo";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { AssetTypeBadge } from "@/components/AssetTypeBadge";
import { StrategySymbolBadge } from "@/components/StrategySymbolBadge";
import { useResearchOverviewBundle } from "@/app/research/ResearchOverviewContext";
import { formatResearchDataAsOf } from "@/lib/formatDataAsOf";
import {
  formatSnapshotSizeLabel,
  formatSnapshotSubtitle,
} from "@/lib/researchSnapshotMeta";

type Props = { symbol: string; compact?: boolean };

function formatPL(value: number) {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function CompanySnapshot({ symbol, compact = false }: Props) {
  const { positionMap } = usePortfolioContext();
  const upperSymbol = symbol.toUpperCase();
  const userPositions = positionMap[upperSymbol];

  const overviewBundle = useResearchOverviewBundle();
  const { snapshot, etfHoldings, isLoading, error } = useResearchSymbolHeader();
  const dataAsOfLabel = formatResearchDataAsOf(overviewBundle?.asOf);
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
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        aria-hidden
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-16 w-56 rounded-xl" />
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
  const dayPL = userPositions?.reduce(
    (sum, p) => sum + p.currentDayProfitLoss,
    0,
  );
  const subtitle = formatSnapshotSubtitle(snapshot, { isEtf, etfHoldings });
  const sizeLabel = formatSnapshotSizeLabel(snapshot, { isEtf, etfHoldings });

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
          <CompanyLogo
            symbol={snapshot.symbol}
            logo={snapshot.logo}
            size="sm"
            isEtf={isEtf}
          />
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
              className="hidden shrink-0 rounded-full border border-accent/40 bg-accent-muted px-2 py-0.5 text-[10px] font-medium text-accent-strong sm:inline-flex"
            >
              Your position
            </Link>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <WatchlistButton symbol={upperSymbol} iconOnly />
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold tabular-nums">
              ${snapshot.price.toLocaleString()}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
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
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 max-w-full space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {researchLabel}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <CompanyLogo
            symbol={snapshot.symbol}
            logo={snapshot.logo}
            size="md"
            isEtf={isEtf}
          />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {snapshot.symbol} · {snapshot.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {assetType ? <AssetTypeBadge assetType={assetType} /> : null}
            <StrategySymbolBadge symbol={upperSymbol} />
          </div>
          {snapshot.weburl && (
            <a
              href={snapshot.weburl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted transition hover:bg-secondary hover:text-foreground"
            >
              Website
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {userPositions?.length ? (
            <Link
              href={symbolHubPath(upperSymbol, "position")}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-muted px-2.5 py-0.5 text-[11px] font-medium text-accent-strong transition hover:bg-accent-muted/80"
            >
              <BriefcaseBusiness className="h-3 w-3" aria-hidden="true" />
              Your position
              {dayPL != null && (
                <span
                  className={cn(
                    "tabular-nums",
                    dayPL >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  · {formatPL(dayPL)} today
                </span>
              )}
            </Link>
          ) : null}
          <WatchlistButton symbol={upperSymbol} />
        </div>
        <WatchlistHint symbol={upperSymbol} />
        <p className="text-sm text-muted">{subtitle}</p>
        {dataAsOfLabel ? (
          <p className="text-[11px] text-muted">Data as of {dataAsOfLabel}</p>
        ) : null}
      </div>

      <div className={cn(appInsetClass, "text-sm")}>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tabular-nums">
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
        <p className="mt-2 text-xs text-muted">{sizeLabel}</p>
      </div>
    </header>
  );
}
