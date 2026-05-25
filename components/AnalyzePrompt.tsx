"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isPortfolio: boolean;
  symbol?: string | null;
  label: string;
  loading?: boolean;
  onClick: () => void;
  showTopBorder?: boolean;
  className?: string;
};

export function AnalyzePrompt({
  isPortfolio,
  symbol = null,
  label,
  loading = false,
  onClick,
  showTopBorder = true,
  className,
}: Props) {
  const title = isPortfolio
    ? "Get an AI read on your portfolio"
    : `Get an AI read on ${symbol}`;

  const description = isPortfolio
    ? "Summarizes concentration, options risk, notable movers, and one recommended next step — without leaving this page."
    : "Summarizes your holdings, P/L, options risk, and one recommended next step — without leaving this page.";

  const buttonClass = cn(
    "mt-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    loading
      ? "cursor-wait border-border bg-muted-bg text-muted"
      : "border-accent/30 bg-accent-muted/40 text-accent-strong hover:border-accent/50 hover:bg-accent-muted disabled:opacity-60",
  );

  return (
    <div
      className={cn(
        showTopBorder && "border-t border-border/70",
        "bg-linear-to-b from-surface-elevated/30 to-transparent px-4 py-6 sm:py-7",
        className,
      )}
    >
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/25 bg-accent-muted/70 text-accent-strong shadow-sm">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (loading) return;
            onClick();
          }}
          className={buttonClass}
        >
          <Sparkles
            className={cn(
              "h-3 w-3",
              loading && "animate-pulse motion-reduce:animate-none",
            )}
            aria-hidden
          />
          {loading ? "Analyzing…" : label}
        </button>
      </div>
    </div>
  );
}
