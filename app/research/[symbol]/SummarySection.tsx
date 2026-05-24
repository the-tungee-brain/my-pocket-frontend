"use client";

import { useStockSummary } from "@/app/hooks/useStockSummary";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

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
    (isLoading ? "Fetching a plain-language explanation for this stock." : "");

  const sentiment = summary?.sentiment;

  const sentimentClasses =
    sentiment === "Bullish"
      ? "bg-accent-muted text-accent-strong border-accent/30"
      : sentiment === "Bearish"
        ? "bg-danger/10 text-danger border-danger/30"
        : "bg-muted-bg text-muted border-border";

  return (
    <div className="space-y-3">
      {sentiment && (
        <div className="flex justify-end">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              sentimentClasses,
            )}
          >
            AI sentiment: {sentiment}
          </span>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <p className="text-sm leading-relaxed text-foreground">{short}</p>
      <p className="text-sm leading-relaxed text-muted">{long}</p>
    </div>
  );
}
