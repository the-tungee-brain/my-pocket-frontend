"use client";

import { useMemo, useState } from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import { MarkdownRenderer } from "./ui/MarkdownRenderer";
import { ThinkingSpinner } from "./ui/ThinkingSpinner";
import { ErrorBanner } from "./ui/ErrorBanner";
import { Button } from "./ui/Button";
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
  const [requested, setRequested] = useState(false);

  const label = useMemo(
    () => (positions?.length ? (symbol ?? "PORTFOLIO") : null),
    [symbol, positions],
  );

  const { loading, error, content, refetch } = useInsights(
    {
      label,
      positions,
      account,
      accessToken: sessionAccessToken || null,
      enabled: requested,
    },
    "gpt-5.4",
  );

  if (!positions?.length) return null;

  const title = symbol ? `${symbol} insights` : "Portfolio insights";
  const hasContent = !!content;
  const showGenerate = !requested && !hasContent;

  const handleGenerate = () => setRequested(true);

  return (
    <section className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-elevated/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
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

        {showGenerate && (
          <Button size="xs" variant="outline" onClick={handleGenerate}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Generate insights
          </Button>
        )}
      </div>

      <div className="px-4 py-4">
        {showGenerate && (
          <p className="text-sm text-muted">
            Get a concise AI summary of{" "}
            {symbol ? `your ${symbol} holdings` : "your portfolio"} — generated
            on demand.
          </p>
        )}

        {loading && <ThinkingSpinner message={thinkingMessage} />}

        {error && <ErrorBanner message={error} onRetry={refetch} />}

        {!loading && !error && content && (
          <div className="text-sm leading-relaxed text-foreground">
            <MarkdownRenderer content={content} />
          </div>
        )}

        {requested && !loading && !error && !content && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted">
              Analysis unavailable right now.
            </p>
            <Button size="xs" variant="outline" onClick={refetch}>
              Retry analysis
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
