"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Check,
  Link2,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useSchwabStatus } from "@/app/hooks/useSchwabStatus";
import { useRecentSymbols } from "@/app/hooks/useRecentSymbols";
import { useWatchlist } from "@/app/hooks/useWatchlist";
import { useAppChatContext, usePortfolioContext } from "@/app/contextSelectors";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import {
  dismissOnboarding,
  isOnboardingDismissed,
} from "@/lib/onboardingStorage";
import { SCHWAB_READ_ONLY_LINE } from "@/lib/schwabTrustCopy";
import { track } from "@/lib/analytics";

type Step = {
  id: string;
  label: string;
  description: string;
  done: boolean;
};

const CORE_STEP_IDS = ["connect", "holdings", "assistant"] as const;

export function PortfolioOnboarding({ className }: { className?: string }) {
  const { authorized: schwabAuthorized, loading: schwabLoading } =
    useSchwabStatus();
  const { allPositions, loading: positionsLoading } = usePortfolioContext();
  const { chatBySymbol } = useAppChatContext();
  const { symbols: watchlist } = useWatchlist();
  const { symbols: recentSymbols } = useRecentSymbols();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(isOnboardingDismissed());
  }, []);

  const hasPortfolioChat =
    (chatBySymbol["__PORTFOLIO_CHAT__"]?.messages.length ?? 0) > 0;

  const steps: Step[] = useMemo(
    () => [
      {
        id: "connect",
        label: "Connect Schwab",
        description:
          "Link your account in Settings with Schwab’s secure OAuth login.",
        done: schwabAuthorized === true,
      },
      {
        id: "holdings",
        label: "Review your holdings",
        description: "Your positions appear here once Schwab is connected.",
        done: allPositions.length > 0,
      },
      {
        id: "assistant",
        label: "Ask the assistant",
        description: "Use quick prompts or type a question in the chat bar below.",
        done: hasPortfolioChat,
      },
      {
        id: "research",
        label: "Research a symbol",
        description: "Open any ticker in Research to view its company snapshot.",
        done: recentSymbols.length > 0,
      },
      {
        id: "watchlist",
        label: "Save to your watchlist",
        description: "Star symbols in Research to track them in the sidebar.",
        done: watchlist.length > 0,
      },
    ],
    [
      schwabAuthorized,
      allPositions.length,
      hasPortfolioChat,
      recentSymbols.length,
      watchlist.length,
    ],
  );

  const coreSteps = steps.filter((step) =>
    (CORE_STEP_IDS as readonly string[]).includes(step.id),
  );
  const optionalSteps = steps.filter(
    (step) => !(CORE_STEP_IDS as readonly string[]).includes(step.id),
  );

  const completedCount = coreSteps.filter((step) => step.done).length;
  const allCoreDone = completedCount === coreSteps.length;
  const pendingOptional = optionalSteps.filter((step) => !step.done);

  if (dismissed || schwabLoading || positionsLoading || allCoreDone) {
    return null;
  }

  const handleDismiss = () => {
    dismissOnboarding();
    setDismissed(true);
    track("onboarding_dismissed", {
      completed_count: completedCount,
      total_steps: coreSteps.length,
    });
  };

  const stepIcon = (id: string) => {
    switch (id) {
      case "connect":
        return Link2;
      case "holdings":
        return BriefcaseBusiness;
      case "assistant":
        return MessageSquare;
      case "research":
        return Search;
      case "watchlist":
        return Star;
      default:
        return Sparkles;
    }
  };

  return (
    <section className={cn("mx-auto mb-4 w-full", className)}>
      <div className="rounded-2xl border border-accent/30 bg-accent-muted/40 p-4 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
              Getting started
            </p>
            <h2 className="mt-1 text-sm font-semibold text-foreground">
              Set up Tomcrest in {coreSteps.length} steps
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {completedCount} of {coreSteps.length} complete
            </p>
          </div>
          <IconButton
            size="sm"
            aria-label="Dismiss getting started guide"
            onClick={handleDismiss}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </IconButton>
        </div>

        <ol className="space-y-3">
          {coreSteps.map((step, index) => {
            const StepIcon = stepIcon(step.id);

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
                  {step.id === "connect" && !step.done && (
                    <>
                      <p className="mt-1.5 text-[11px] text-muted">
                        {SCHWAB_READ_ONLY_LINE}
                      </p>
                      <Link
                        href="/settings"
                        className="mt-1.5 inline-flex text-[11px] font-medium text-accent-strong transition hover:underline"
                      >
                        Open Settings to connect
                      </Link>
                      <p className="mt-1.5 text-[11px] text-muted">
                        On mobile, open the menu — Connect is at the bottom of the
                        sidebar.
                      </p>
                    </>
                  )}
                  {step.id === "assistant" &&
                    !step.done &&
                    allPositions.length > 0 && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-accent-strong">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Try a quick prompt in the chat bar below
                      </p>
                    )}
                  {step.id === "research" && !step.done && (
                    <Link
                      href="/research"
                      className="mt-1.5 inline-flex text-[11px] font-medium text-accent-strong transition hover:underline"
                    >
                      Go to Research
                    </Link>
                  )}
                  {step.id === "watchlist" && !step.done && (
                    <p className="mt-1.5 text-[11px] text-muted">
                      Open a symbol in Research and tap the star button.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {pendingOptional.length > 0 && (
          <p className="mt-3 border-t border-border/60 pt-3 text-[11px] text-muted">
            Explore:{" "}
            {!optionalSteps.find((s) => s.id === "research")?.done && (
              <Link
                href="/research"
                className="font-medium text-accent-strong hover:underline"
              >
                Research a symbol
              </Link>
            )}
            {!optionalSteps.find((s) => s.id === "research")?.done &&
              !optionalSteps.find((s) => s.id === "watchlist")?.done &&
              " · "}
            {!optionalSteps.find((s) => s.id === "watchlist")?.done && (
              <span>Star symbols in Research for your watchlist</span>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
