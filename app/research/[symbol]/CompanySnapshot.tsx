"use client";

import Link from "next/link";
import { useResearchSnapshot } from "@/app/hooks/useResearchSnapshot";
import {
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  BriefcaseBusiness,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { usePositionsContext } from "@/app/Providers";
import { tabQuerySuffix, useTabs } from "@/app/contexts/TabContext";

type Props = { symbol: string };

function formatPL(value: number) {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function CompanySnapshot({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { positionMap } = usePositionsContext();
  const { activeTab } = useTabs();
  const upperSymbol = symbol.toUpperCase();
  const userPositions = positionMap[upperSymbol];

  const { snapshot, isLoading, error } = useResearchSnapshot(upperSymbol, {
    accessToken,
  });

  if (isLoading) {
    return (
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted-bg" />
          <div className="h-7 w-64 animate-pulse rounded bg-muted-bg" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted-bg" />
        </div>
        <div className="h-16 w-56 animate-pulse rounded-xl bg-muted-bg" />
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

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Stock research
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {snapshot.logo && (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
              <img
                src={snapshot.logo}
                alt={`${snapshot.name} logo`}
                className="h-full w-full object-contain p-1.5"
              />
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {snapshot.symbol} · {snapshot.name}
          </h1>
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
              href={`/portfolio/positions/${upperSymbol}${tabQuerySuffix(activeTab)}`}
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
        </div>
        <p className="text-sm text-muted">
          {snapshot.sector} · {snapshot.country}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-secondary/80 px-4 py-3 text-sm">
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
        <p className="mt-2 text-xs text-muted">
          Market cap: {snapshot.marketCap} · 52-week: {snapshot.range52w}
        </p>
      </div>
    </header>
  );
}
