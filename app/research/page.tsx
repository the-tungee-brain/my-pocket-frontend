"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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

  return (
    <div className="flex h-full w-full items-center justify-center px-4">
      <div className="relative w-full max-w-3xl">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol, e.g. NVDA"
            className="w-full rounded-2xl border border-neutral-300 bg-white px-9 py-4 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        {(isLoading || error || hasResults || showEmptyState) && (
          <div className="absolute left-0 right-0 mt-1 rounded-md border border-neutral-200 bg-white text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
            {isLoading && (
              <div className="px-3 py-2 text-neutral-500">
                Searching symbols…
              </div>
            )}

            {error && (
              <div className="px-3 py-2 text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {showEmptyState && (
              <div className="px-3 py-2 text-neutral-500">
                No symbols found for &quot;{query.trim().toUpperCase()}&quot;.
              </div>
            )}

            {hasResults && (
              <ul className="max-h-64 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
                {results.map((item) => (
                  <li
                    key={item.symbol}
                    className="flex cursor-pointer items-center justify-between px-3 py-2 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800/70"
                    onClick={() => handleSymbolClick(item)}
                  >
                    <span className="font-mono font-semibold">
                      {item.symbol}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
