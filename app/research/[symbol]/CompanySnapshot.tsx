"use client";

import { useResearchSnapshot } from "@/app/hooks/useResearchSnapshot";
import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";

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
          <div className="h-4 w-32 rounded bg-secondary animate-pulse" />
          <div className="h-7 w-64 rounded bg-secondary animate-pulse" />
          <div className="h-4 w-40 rounded bg-secondary animate-pulse" />
        </div>
        <div className="h-16 w-56 rounded-xl bg-secondary animate-pulse" />
      </header>
    );
  }

  if (error || !snapshot) {
    return (
      <header className="flex flex-col gap-2">
        <p className="text-xs text-red-600">
          Could not load snapshot for this symbol.
        </p>
      </header>
    );
  }

  const positiveChange = snapshot.changePct >= 0;

  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          Stock research
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {snapshot.logo && (
            <div className="mt-1 h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
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
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-neutral-600 hover:bg-secondary dark:text-neutral-300"
            >
              Website
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Sector: {snapshot.sector} · Country: {snapshot.country}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold">
            ${snapshot.price.toLocaleString()}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              positiveChange
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
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
        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          Market cap: {snapshot.marketCap} · 52‑week range: {snapshot.range52w}
        </p>
      </div>
    </header>
  );
}
