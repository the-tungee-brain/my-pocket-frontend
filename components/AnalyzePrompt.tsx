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
  title?: string;
  description?: string;
  loadingLabel?: string;
};

export function AnalyzePrompt({
  isPortfolio,
  symbol = null,
  label,
  loading = false,
  onClick,
  showTopBorder = true,
  className,
  title: titleOverride,
  description: descriptionOverride,
  loadingLabel = "Analyzing…",
}: Props) {
  const title =
    titleOverride ??
    (isPortfolio
      ? "In-depth diversification review"
      : `Get an AI read on ${symbol}`);

  const description =
    descriptionOverride ??
    (isPortfolio
      ? "See how your holdings are spread across names, sectors, and cash — where you're concentrated, and how to balance the mix."
      : "Summarizes your holdings, P/L, options risk, and one recommended next step.");

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
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {description}
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (loading) return;
            onClick();
          }}
          className={buttonClass}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span
                className="relative flex h-3.5 w-3.5 items-center justify-center"
                aria-hidden
              >
                <span className="absolute h-3.5 w-3.5 rounded-full bg-accent/10 loading-soft-ring motion-reduce:opacity-40" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-accent/75 loading-soft-core motion-reduce:opacity-80" />
              </span>
              {loadingLabel}
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" aria-hidden />
              {label}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
