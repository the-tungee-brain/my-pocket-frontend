"use client";

import { useStockSummary } from "@/app/hooks/useStockSummary";
import { Info } from "lucide-react";
import { useSession } from "next-auth/react";

type SummarySectionProps = {
  symbol: string;
};

export function SummarySection({ symbol }: SummarySectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { summary, isLoading, error } = useStockSummary(symbol, {
    accessToken,
  });

  const short = summary?.short ?? (isLoading ? "Loading overview..." : "");
  const long =
    summary?.long ??
    (isLoading ? "Fetching a plain‑language explanation for this stock." : "");

  const sentiment = summary?.sentiment;

  const sentimentClasses =
    sentiment === "Bullish"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300/60"
      : sentiment === "Bearish"
        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300/60"
        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300/60";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Info className="h-4 w-4 text-neutral-500" />
          Big picture in plain language
        </h2>

        {sentiment && (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${sentimentClasses}`}
          >
            AI sentiment: {sentiment}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        {short}
      </p>
      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        {long}
      </p>
    </section>
  );
}
