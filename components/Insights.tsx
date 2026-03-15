// Insights.tsx
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamAnalysis } from "@/lib/apiClient";
import type { Position } from "./AccountPositionList";

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
        <p className="text-sm text-neutral-400">Analyzing this position…</p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && content && (
        <div className="mt-2 text-sm text-foreground">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-3 text-xl font-semibold tracking-tight">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mt-4 mb-2 text-lg font-semibold tracking-tight">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-3 mb-1.5 text-base font-semibold tracking-tight text-neutral-200">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="whitespace-pre-wrap break-words text-base leading-relaxed tracking-wide mb-2">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="my-2 ml-5 list-disc space-y-1 text-base leading-relaxed">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="my-2 ml-5 list-decimal space-y-1 text-base leading-relaxed">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li>{children}</li>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 underline decoration-sky-500/60 underline-offset-2 hover:text-sky-300"
                >
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-3 border-l-2 border-neutral-700 pl-3 text-sm text-neutral-300 italic">
                  {children}
                </blockquote>
              ),
              code: ({ children, ...props }) => (
                <code
                  {...props}
                  className="whitespace-pre-wrap break-words text-sm leading-relaxed tracking-wide bg-neutral-900/40 px-1.5 py-0.5 rounded"
                >
                  {children}
                </code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </section>
  );
}
