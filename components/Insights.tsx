"use client";

import { useMemo } from "react";
import type { Position } from "./AccountPositionList";
import { MarkdownRenderer } from "./ui/MarkdownRenderer";
import { ThinkingSpinner } from "./ui/ThinkingSpinner";
import { usePositionsContext } from "@/app/Providers";

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
  const { insightsByKey, buildInsightKey } = usePositionsContext();

  const key = useMemo(() => {
    if (!positions?.length) return null;
    const label = symbol ?? "PORTFOLIO";
    return buildInsightKey(label, positions);
  }, [symbol, positions, buildInsightKey]);

  const insight = key ? insightsByKey[key] : null;

  const loading = !!key && (!insight || insight.loading);
  const error = insight?.error ?? null;
  const content = insight?.content ?? null;

  if (!positions?.length) {
    return null;
  }

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
