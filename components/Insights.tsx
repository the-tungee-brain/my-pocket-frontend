"use client";

import { useMemo } from "react";
import { MarkdownRenderer } from "./ui/MarkdownRenderer";
import { ThinkingSpinner } from "./ui/ThinkingSpinner";
import { usePositionsContext } from "@/app/Providers";
import { useInsights } from "@/app/hooks/useInsights";
import { Position } from "@/app/types/schwab";

type Props = {
  symbol: string | null;
  positions: Position[] | null;
  thinkingMessage?: string;
};

export function Insights({
  symbol,
  positions,
  thinkingMessage = "Analyzing",
}: Props) {
  const { account, sessionAccessToken } = usePositionsContext();

  const label = useMemo(
    () => (positions?.length ? (symbol ?? "PORTFOLIO") : null),
    [symbol, positions],
  );

  const { loading, error, content } = useInsights(
    {
      label,
      positions,
      account,
      accessToken: sessionAccessToken || null,
    },
    "gpt-4.1-mini",
  );

  if (!positions?.length) return null;

  return (
    <section className="mx-auto mt-6 max-w-3xl rounded-xl border border-border bg-secondary/60 px-4 py-3">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Insights
      </h2>

      {loading && <ThinkingSpinner message={thinkingMessage} />}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && content && (
        <div className="mt-2 text-sm text-foreground">
          <MarkdownRenderer content={content} />
        </div>
      )}
    </section>
  );
}
