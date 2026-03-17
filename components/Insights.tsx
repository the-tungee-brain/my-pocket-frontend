import { useEffect, useRef, useState } from "react";
import { streamAnalysis } from "@/lib/apiClient";
import type { Position } from "./AccountPositionList";
import { MarkdownRenderer } from "./ui/MarkdownRenderer";
import { ThinkingSpinner } from "./ui/ThinkingSpinner";

type Props = {
  symbol: string | null;
  positions: Position[] | null;
  accessToken?: string;
  thinkingMessage?: string;
};

export function Insights({
  symbol,
  positions,
  accessToken,
  thinkingMessage = "Analyzing",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [runId, setRunId] = useState(0);

  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!positions?.length || !accessToken) return;

    if (hasRunRef.current) return;
    hasRunRef.current = true;

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
  }, [positions, accessToken, runId]);

  const handleReanalyze = () => {
    hasRunRef.current = false;
    setRunId((id) => id + 1);
  };

  return (
    <section className="mx-auto mt-6 max-w-3xl rounded-xl border border-border bg-secondary/60 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Insights
        </h2>

        <button
          type="button"
          onClick={handleReanalyze}
          disabled={loading || !positions?.length || !accessToken}
          className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-900/70 px-2.5 py-1 text-xs text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-900/40 disabled:text-neutral-500"
        >
          {loading ? "Analyzing…" : "Reanalyze"}
        </button>
      </div>

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
