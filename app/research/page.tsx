"use client";

import { History, Search, SearchX, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type KeyboardEvent, useRef, useState } from "react";
import { usePortfolioContext } from "@/app/contextSelectors";
import { PageShell } from "@/components/PageShell";
import { SymbolSearchResult } from "@/components/SymbolSearchResult";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonList } from "@/components/ui/Skeleton";
import { appStackClass } from "@/lib/appUi";
import {
  moversMetaBodyClass,
  moversMetaCardClass,
  moversMetaEyebrowClass,
  moversMetaInsetClass,
  moversMetaTitleClass,
} from "@/lib/moversUi";
import { rememberAssetType } from "@/lib/researchAssetType";
import { cn } from "@/lib/utils";
import { useRecentSymbols } from "../hooks/useRecentSymbols";
import {
  type TickerSymbolItem,
  useSymbolSearch,
} from "../hooks/useSymbolSearch";
import { useWatchlist } from "../hooks/useWatchlist";

export default function ResearchPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const [query, setQuery] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { symbols: portfolioSymbols } = usePortfolioContext();

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
      setActiveIndex((index) => (index < results.length - 1 ? index + 1 : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index > 0 ? index - 1 : results.length - 1));
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

  const hasQuickAccess =
    watchlist.length > 0 || recentWithoutWatchlist.length > 0;
  const showIdleHelper = !query.trim() && !hasQuickAccess;

  return (
    <PageShell className={cn(appStackClass, "pt-4 pb-8 sm:pt-6")}>
      <header className="space-y-1">
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
          Research
        </h1>
        <p className="text-sm text-muted">
          Search a symbol, open its hub, and move from scan to decision.
        </p>
      </header>

      <section
        className={cn(moversMetaCardClass, "px-0")}
        aria-label="Research workspace"
      >
        <p className={moversMetaEyebrowClass}>Research workspace</p>
        <h2 className={moversMetaTitleClass}>Company context in one hub</h2>
        <p className={moversMetaBodyClass}>
          Start with ticker search, then use Overview, Analysis, Events,
          Options, and Positions without leaving the symbol workspace.
        </p>
        <dl
          className={cn(
            moversMetaInsetClass,
            "grid gap-2 text-xs sm:grid-cols-3",
          )}
        >
          <div>
            <dt className="text-muted">Watchlist</dt>
            <dd className="font-mono font-semibold text-foreground">
              {watchlist.length}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Recent</dt>
            <dd className="font-mono font-semibold text-foreground">
              {recentSymbols.length}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Shortcut</dt>
            <dd className="font-mono font-semibold text-foreground">/ or ⌘K</dd>
          </div>
        </dl>
      </section>

      <section
        className="app-panel overflow-visible! py-3 sm:py-4"
        aria-label="Symbol search"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={moversMetaEyebrowClass}>Symbol search</p>
            <p className="mt-1 text-sm text-muted">
              Search ticker or company name across stocks, ETFs, and more.
            </p>
          </div>
          <Link
            href="/watchlist"
            className="text-xs font-medium text-accent-strong transition hover:underline"
          >
            Manage watchlist
          </Link>
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search symbol or company, e.g. NVDA"
            role="combobox"
            aria-label="Search ticker or company name"
            aria-autocomplete="list"
            aria-expanded={hasResults}
            aria-controls={hasResults ? listboxId : undefined}
            aria-activedescendant={
              activeIndex >= 0
                ? `research-symbol-option-${activeIndex}`
                : undefined
            }
            className="min-h-12 w-full border border-border bg-background px-9 py-3 text-sm text-foreground outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {showIdleHelper && (
          <div className="mt-3">
            <EmptyState
              icon={Search}
              title="Find a symbol to research"
              description="Search by ticker or company name, or open a holding from your portfolio to dig into fundamentals, holdings, and news."
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
          <div className={cn(moversMetaInsetClass, "mt-3")}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className={moversMetaEyebrowClass}>Your watchlist</p>
              <Link
                href="/watchlist"
                className="text-[11px] font-medium text-accent-strong hover:underline"
              >
                Manage folders
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 overflow-visible">
              {watchlist.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  className="app-chip min-h-9 flex-row! items-center! justify-center! gap-1.5 whitespace-nowrap px-3 py-2 font-mono text-xs text-accent-strong"
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
          <div className={cn(moversMetaInsetClass, "mt-3")}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className={moversMetaEyebrowClass}>Recently viewed</p>
              <button
                type="button"
                onClick={clearRecentSymbols}
                className="text-[10px] font-medium text-muted transition hover:text-foreground"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 overflow-visible">
              {recentWithoutWatchlist.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  className="app-chip min-h-9 flex-row! items-center! justify-center! gap-1.5 whitespace-nowrap px-3 py-2 font-mono text-xs text-foreground"
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
          <div className={cn(moversMetaInsetClass, "mt-3")}>
            <p className={cn(moversMetaEyebrowClass, "mb-2")}>Try an example</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  className="app-chip min-h-9 flex-row items-center px-3 py-2 font-mono text-xs text-foreground"
                  onClick={() => openSymbol(symbol)}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {(isLoading || error || hasResults || showEmptyState) && (
          <div className="mt-3 overflow-hidden border border-border bg-background text-sm">
            {isLoading && (
              <SkeletonList rows={3} rowClassName="h-9" className="p-3" />
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
              <div
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
              </div>
            )}
          </div>
        )}
      </section>
    </PageShell>
  );
}
