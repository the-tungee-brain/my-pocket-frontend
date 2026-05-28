"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { History, Search, SearchX, Star, TrendingUp } from "lucide-react";

import { TickerSymbolItem, useSymbolSearch } from "../hooks/useSymbolSearch";
import { useRecentSymbols } from "../hooks/useRecentSymbols";
import { useWatchlist } from "../hooks/useWatchlist";
import { usePositionsContext } from "../Providers";
import { rememberAssetType } from "@/lib/researchAssetType";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SymbolSearchResult } from "@/components/SymbolSearchResult";
import { PageShell } from "@/components/PageShell";
import { ResearchOnboarding } from "@/components/ResearchOnboarding";

export default function ResearchPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const [query, setQuery] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { symbols: portfolioSymbols } = usePositionsContext();

  const { symbols: watchlist } = useWatchlist();
  const { symbols: recentSymbols, clear: clearRecentSymbols } =
    useRecentSymbols();
  const { results, isLoading, error, refetch } = useSymbolSearch(query, {
    accessToken,
    limit: 10,
  });

  const hasResults = !isLoading && !error && results.length > 0;
  const showEmptyState =
    !isLoading && !error && results.length === 0 && query.trim().length > 0;
  const listboxId = "research-symbol-listbox";

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, results]);

  const openSymbol = (symbol: string) => {
    const upper = symbol.toUpperCase();
    setQuery(upper);
    router.push(`/research/${encodeURIComponent(upper)}/overview`);
  };

  const handleSymbolClick = (item: TickerSymbolItem) => {
    rememberAssetType(item.symbol, item.assetType);
    openSymbol(item.symbol);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && hasResults) {
      event.preventDefault();
      handleSymbolClick(results[activeIndex >= 0 ? activeIndex : 0]);
      return;
    }

    if (!hasResults) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        index < results.length - 1 ? index + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        index > 0 ? index - 1 : results.length - 1,
      );
      return;
    }

    if (event.key === "Escape") {
      setActiveIndex(-1);
    }
  };

  const examples = ["NVDA", "SPY", "AAPL", "SCHD"];
  const watchlistSet = new Set(watchlist);
  const recentWithoutWatchlist = recentSymbols.filter(
    (symbol) => !watchlistSet.has(symbol),
  );

  const hasQuickAccess = watchlist.length > 0 || recentWithoutWatchlist.length > 0;
  const showIdleHelper = !query.trim() && !hasQuickAccess;

  return (
    <PageShell className="pt-8 pb-4">
      <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-accent-muted text-accent-strong">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Research
            </h1>
            <p className="mt-1 text-sm text-muted">
              Search a ticker to open its research hub — stocks, ETFs, and more.
              <span className="hidden sm:inline"> Press </span>
              <kbd className="mx-1 hidden rounded border border-border bg-muted-bg px-1.5 py-0.5 font-mono text-[10px] text-muted sm:inline">
                /
              </kbd>
              <span className="hidden sm:inline"> to focus search.</span>
            </p>
          </div>
        </div>

        <ResearchOnboarding />

        <div className="relative rounded-2xl border border-border bg-secondary/80 p-3 shadow-lg shadow-black/10">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Search className="h-4 w-4" aria-hidden="true" />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search symbol or company, e.g. NVDA"
              role="combobox"
              aria-label="Search ticker symbol"
              aria-autocomplete="list"
              aria-expanded={hasResults}
              aria-controls={hasResults ? listboxId : undefined}
              aria-activedescendant={
                activeIndex >= 0
                  ? `research-symbol-option-${activeIndex}`
                  : undefined
              }
              className="w-full rounded-xl border border-border bg-background px-9 py-3.5 text-sm text-foreground outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {showIdleHelper && (
            <div className="mt-3">
              <EmptyState
                icon={Search}
                title="Find a symbol to research"
                description="Search by ticker above, or open a holding from your portfolio to dig into fundamentals, holdings, and news."
                variant="solid"
                className="py-6"
                action={
                  portfolioSymbols.length > 0 ? (
                    <Link
                      href="/portfolio"
                      className="inline-flex text-xs font-medium text-accent-strong transition hover:underline"
                    >
                      View your portfolio
                    </Link>
                  ) : undefined
                }
              />
            </div>
          )}

          {watchlist.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                Your watchlist
              </p>
              <div className="flex flex-wrap gap-2">
                {watchlist.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-accent/30 bg-accent-muted px-3.5 py-2 text-xs font-mono text-accent-strong transition hover:border-accent/50"
                    onClick={() => openSymbol(symbol)}
                  >
                    <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recentWithoutWatchlist.length > 0 && (
            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  Recently viewed
                </p>
                <button
                  type="button"
                  onClick={clearRecentSymbols}
                  className="text-[10px] font-medium text-muted transition hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentWithoutWatchlist.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-mono text-foreground transition hover:border-accent/50 hover:bg-secondary"
                    onClick={() => openSymbol(symbol)}
                  >
                    <History className="h-3 w-3 text-muted" aria-hidden="true" />
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasQuickAccess && (
            <div className="mt-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                Try an example
              </p>
              <div className="flex flex-wrap gap-2">
                {examples.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-mono text-foreground transition hover:border-accent/50 hover:bg-secondary"
                    onClick={() => openSymbol(symbol)}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(isLoading || error || hasResults || showEmptyState) && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background text-sm">
              {isLoading && (
                <div className="space-y-2 p-3">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted-bg" />
                  <div className="h-9 animate-pulse rounded-lg bg-muted-bg/70" />
                  <div className="h-9 animate-pulse rounded-lg bg-muted-bg/50" />
                </div>
              )}

              {error && (
                <div className="p-3">
                  <ErrorBanner message={error} onRetry={refetch} />
                </div>
              )}

              {showEmptyState && (
                <div className="p-3">
                  <EmptyState
                    icon={SearchX}
                    title="No symbols found"
                    description={`We couldn't find a match for "${query.trim().toUpperCase()}". Try another ticker.`}
                    variant="solid"
                    className="py-6"
                  />
                </div>
              )}

              {hasResults && (
                <ul
                  id={listboxId}
                  role="listbox"
                  aria-label="Symbol search results"
                  className="max-h-72 divide-y divide-border overflow-y-auto"
                >
                  {results.map((item, index) => (
                    <SymbolSearchResult
                      key={item.symbol}
                      item={item}
                      index={index}
                      activeIndex={activeIndex}
                      onSelect={handleSymbolClick}
                      onHover={() => setActiveIndex(index)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
    </PageShell>
  );
}
