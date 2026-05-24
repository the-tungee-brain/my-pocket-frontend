"use client";

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
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
    "gpt-5.4",
  );

  if (!positions?.length) return null;

  const title = symbol ? `${symbol} insights` : "Portfolio insights";

  return (
    <section className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border bg-surface-elevated/50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold capitalize text-foreground">
            {title}
          </h2>
          <p className="text-[11px] text-muted">AI-generated analysis</p>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading && <ThinkingSpinner message={thinkingMessage} />}

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {!loading && !error && content && (
          <div className="text-sm leading-relaxed text-foreground">
            <MarkdownRenderer content={content} />
          </div>
        )}
      </div>
    </section>
  );
}
