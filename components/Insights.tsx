// Insights.tsx
import { useEffect, useState } from "react";
import { streamAnalysis } from "@/lib/apiClient";
import type { Position } from "./AccountPositionList";
import { MarkdownRenderer } from "./ui/MarkdownRenderer";

type Props = {
  symbol: string | null;
  positions: Position[] | null;
  accessToken?: string;
};

export function Insights({ symbol, positions, accessToken }: Props) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol || !positions?.length || !accessToken) return;

    let cancelled = false;
    let buffer = "";

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setContent(null);

        await streamAnalysis(
          { positions, prompt: null },
          accessToken,
          (chunk) => {
            if (cancelled) return;
            buffer += chunk;
            setContent(buffer);
          },
        );

        if (!cancelled) {
          setLoading(false);
        }
      } catch {
        if (cancelled) return;
        setLoading(false);
        setError("Failed to load insights for this position.");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [symbol, positions, accessToken]);

  return (
    <section className="mx-auto mt-6 max-w-3xl rounded-xl border border-border bg-secondary/60 px-4 py-3">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Insights
      </h2>

      {loading && (
        <div className="mt-1 flex items-center gap-2 text-sm text-neutral-400">
          <span>Analyzing this position</span>
          <span className="flex items-center gap-1">
            <span className="h-1.25 w-1.25 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
            <span className="h-1.25 w-1.25 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
            <span className="h-1.25 w-1.25 animate-bounce rounded-full bg-neutral-400" />
          </span>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && content && (
        <div className="mt-2 text-sm text-foreground">
          <MarkdownRenderer content={content} />
        </div>
      )}
    </section>
  );
}
