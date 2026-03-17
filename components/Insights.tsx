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

  // track if we've already called streamAnalysis for this mount
  const hasRunRef = useRef(false);

  useEffect(() => {
    // wait until data is ready
    if (!positions?.length || !accessToken) return;

    // ensure we only run once
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
  }, [positions, accessToken]); // re-evaluate when these become non-null/ready[web:10][web:17]

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
