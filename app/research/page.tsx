"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

import { TickerSymbolItem, useSymbolSearch } from "../hooks/useSymbolSearch";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export default function ResearchPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const [query, setQuery] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();

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
    openSymbol(item.symbol);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSymbolClick(results[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setActiveIndex(-1);
    }
  };

  const examples = ["NVDA", "AAPL", "MSFT", "TSLA"];

  return (
    <div className="flex min-h-[calc(100vh-9rem)] w-full items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-accent-muted text-accent-strong">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Research
            </h1>
            <p className="mt-1 text-sm text-muted">
              Search a ticker to open its company, performance, and news view.
            </p>
          </div>
        </div>

        <div className="relative rounded-2xl border border-border bg-secondary/80 p-3 shadow-lg shadow-black/10">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Search className="h-4 w-4" aria-hidden="true" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search symbol, e.g. NVDA"
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

          <div className="mt-3 flex flex-wrap gap-2">
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
                <div className="px-3 py-3 text-muted">
                  No symbols found for &quot;{query.trim().toUpperCase()}&quot;.
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
                    <li key={item.symbol} role="presentation">
                      <button
                        id={`research-symbol-option-${index}`}
                        type="button"
                        role="option"
                        aria-selected={index === activeIndex}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-secondary/80",
                          index === activeIndex && "bg-muted-bg",
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => handleSymbolClick(item)}
                      >
                        <span className="font-mono font-semibold text-foreground">
                          {item.symbol}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          Open
                          <ArrowRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
