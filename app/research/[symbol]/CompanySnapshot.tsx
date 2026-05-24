"use client";

import { useResearchSnapshot } from "@/app/hooks/useResearchSnapshot";
import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

type Props = { symbol: string };

export function CompanySnapshot({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { snapshot, isLoading, error } = useResearchSnapshot(
    symbol.toUpperCase(),
    { accessToken },
  );

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
        <p className="text-xs text-danger">
          Could not load snapshot for this symbol.
        </p>
      </header>
    );
  }

  const positiveChange = snapshot.changePct >= 0;

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
