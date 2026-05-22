"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, TrendingUp } from "lucide-react";

import { TickerSymbolItem, useSymbolSearch } from "../hooks/useSymbolSearch";

export default function ResearchPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const [query, setQuery] = useState<string>("");
  const router = useRouter();

  const { results, isLoading, error } = useSymbolSearch(query, {
    accessToken,
    limit: 10,
  });

  const hasResults = !isLoading && !error && results.length > 0;
  const showEmptyState =
    !isLoading && !error && results.length === 0 && query.trim().length > 0;

  const handleSymbolClick = (item: TickerSymbolItem) => {
    const symbol = item.symbol.toUpperCase();
    setQuery(symbol);
    router.push(`/research/${encodeURIComponent(symbol)}`);
  };
  const examples = ["NVDA", "AAPL", "MSFT", "TSLA"];

  return (
    <div className="flex min-h-[calc(100vh-9rem)] w-full items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-emerald-300">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Research
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Search a ticker to open its company, performance, and news view.
            </p>
          </div>
        </div>

        <div className="relative rounded-2xl border border-border bg-secondary/80 p-3 shadow-lg shadow-black/10">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              <Search className="h-4 w-4" aria-hidden="true" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbol, e.g. NVDA"
              aria-label="Search ticker symbol"
              className="w-full rounded-xl border border-border bg-background px-9 py-3.5 text-sm text-foreground outline-none ring-0 transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/30"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {examples.map((symbol) => (
              <button
                key={symbol}
                type="button"
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-mono text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-800/70"
                onClick={() => setQuery(symbol)}
              >
                {symbol}
              </button>
            ))}
          </div>

          {(isLoading || error || hasResults || showEmptyState) && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background text-sm">
              {isLoading && (
                <div className="space-y-2 p-3">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-800" />
                  <div className="h-9 animate-pulse rounded-lg bg-neutral-800/70" />
                  <div className="h-9 animate-pulse rounded-lg bg-neutral-800/50" />
                </div>
              )}

              {error && (
                <div className="px-3 py-3 text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {showEmptyState && (
                <div className="px-3 py-3 text-neutral-500">
                  No symbols found for &quot;{query.trim().toUpperCase()}&quot;.
                </div>
              )}

              {hasResults && (
                <ul className="max-h-72 overflow-y-auto divide-y divide-border">
                  {results.map((item) => (
                    <li key={item.symbol}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-all hover:bg-neutral-800/70"
                        onClick={() => handleSymbolClick(item)}
                      >
                        <span className="font-mono font-semibold text-foreground">
                          {item.symbol}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
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
