"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  MessageSquare,
  Search,
  Star,
  X,
} from "lucide-react";
import { usePositionsContext } from "@/app/Providers";
import { useWatchlist } from "@/app/hooks/useWatchlist";
import { useRecentSymbols } from "@/app/hooks/useRecentSymbols";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import {
  dismissResearchOnboarding,
  isResearchOnboardingDismissed,
} from "@/lib/onboardingStorage";

type Step = {
  id: string;
  label: string;
  description: string;
  done: boolean;
};

export function ResearchOnboarding() {
  const { symbols: watchlist } = useWatchlist();
  const { symbols: recentSymbols } = useRecentSymbols();
  const { chatBySymbol } = usePositionsContext();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(isResearchOnboardingDismissed());
  }, []);

  const hasResearchChat = Object.entries(chatBySymbol).some(
    ([key, state]) =>
      key !== "__PORTFOLIO_CHAT__" &&
      key !== "__NONE__" &&
      (state?.messages.length ?? 0) > 0,
  );

  const hasOpenedSymbol = recentSymbols.length > 0;

  const steps: Step[] = useMemo(
    () => [
      {
        id: "search",
        label: "Search ticker or company name",
        description: "Open a symbol from search to view its research hub.",
        done: hasOpenedSymbol,
      },
      {
        id: "watchlist",
        label: "Save to your watchlist",
        description: "Star a symbol to track it in the sidebar.",
        done: watchlist.length > 0,
      },
      {
        id: "assistant",
        label: "Ask the assistant",
        description: "On a symbol page, use quick prompts or type a question below.",
        done: hasResearchChat,
      },
    ],
    [hasOpenedSymbol, watchlist.length, hasResearchChat],
  );

  const completedCount = steps.filter((step) => step.done).length;
  const allDone = completedCount === steps.length;

  if (dismissed || allDone) {
    return null;
  }

  const handleDismiss = () => {
    dismissResearchOnboarding();
    setDismissed(true);
  };

  return (
    <section className="mb-4">
      <div className="rounded-2xl border border-accent/30 bg-accent-muted/40 p-4 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
              Research
            </p>
            <h2 className="mt-1 text-sm font-semibold text-foreground">
              Explore any public company
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {completedCount} of {steps.length} complete
            </p>
          </div>
          <IconButton
            size="sm"
            aria-label="Dismiss research guide"
            onClick={handleDismiss}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </IconButton>
        </div>

        <ol className="space-y-3">
          {steps.map((step, index) => {
            const StepIcon =
              step.id === "search"
                ? Search
                : step.id === "watchlist"
                  ? Star
                  : MessageSquare;

            return (
              <li
                key={step.id}
                className={cn(
                  "flex gap-3 rounded-xl border px-3 py-2.5",
                  step.done
                    ? "border-accent/30 bg-background/60"
                    : "border-border bg-background/40",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    step.done
                      ? "bg-accent-muted text-accent-strong"
                      : "bg-muted-bg text-muted",
                  )}
                >
                  {step.done ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StepIcon
                      className="h-3.5 w-3.5 text-muted"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-foreground">
                      {step.label}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
